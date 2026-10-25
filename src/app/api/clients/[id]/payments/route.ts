import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPaymentConfirmationEmail } from "@/lib/email";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const payments = await prisma.payment.findMany({
      where: { clientId: id },
      orderBy: { paymentDate: "desc" },
    });
    return NextResponse.json({ payments });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch payments", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const {
      amount,
      paymentMethod = "Bank Transfer / UPI",
      referenceNumber,
      notes,
      paymentDate,
    } = body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return NextResponse.json(
        { error: "Payment amount must be greater than 0" },
        { status: 400 }
      );
    }

    const client = await prisma.client.findUnique({
      where: { id },
      include: { payments: true },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          clientId: id,
          amount: numAmount,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          paymentMethod,
          referenceNumber: referenceNumber || `PAY-${Date.now().toString().slice(-6)}`,
          notes: notes || null,
          status: "COMPLETED",
        },
      });

      const updatedAmountPaid = client.amountPaid + numAmount;
      const newBalance = Math.max(0, client.totalFee - updatedAmountPaid);
      let newPaymentStatus = client.paymentStatus;
      if (client.totalFee > 0) {
        if (updatedAmountPaid >= client.totalFee) {
          newPaymentStatus = "PAID";
        } else {
          newPaymentStatus = "PARTIALLY_PAID";
        }
      }

      let newStage = client.currentStage;
      if (client.currentStage === "CONFIRMED" && (newPaymentStatus === "PAID" || newPaymentStatus === "PARTIALLY_PAID")) {
        newStage = "PAID";
        await tx.clientStageHistory.create({
          data: {
            clientId: id,
            previousStage: "CONFIRMED",
            newStage: "PAID",
            changedBy: "System (Payment Confirmation)",
            notes: `Auto-advanced to PAID on payment receipt of ₹${numAmount.toLocaleString()}`,
            clientNote: `Payment of ₹${numAmount.toLocaleString()} confirmed. Milestone advanced to Paid.`,
          },
        });
      }

      const updatedClient = await tx.client.update({
        where: { id },
        data: {
          amountPaid: updatedAmountPaid,
          balance: newBalance,
          paymentStatus: newPaymentStatus,
          currentStage: newStage,
        },
        include: {
          staff: true,
        },
      });

      await tx.notification.create({
        data: {
          title: "Payment Received",
          message: `Received ₹${numAmount.toLocaleString()} from ${client.name}.`,
          type: "SUCCESS",
        },
      });

      await tx.auditLog.create({
        data: {
          action: "RECORD_PAYMENT",
          entityType: "PAYMENT",
          entityId: payment.id,
          details: `Recorded payment of ₹${numAmount} for ${client.name}`,
          performedBy: "Staff Member",
        },
      });

      return { payment, client: updatedClient };
    });

    // Dispatch real-time payment confirmation email to candidate
    if (result.client.email) {
      await sendPaymentConfirmationEmail({
        to: result.client.email,
        candidateName: result.client.name,
        amount: numAmount,
        paymentMethod,
        paymentStatus: result.client.paymentStatus,
        balance: result.client.balance,
        specialistName: result.client.staff?.name || "Career Specialist",
      }).catch((err) => console.error("Payment email error:", err));
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to record payment", details: error.message },
      { status: 500 }
    );
  }
}
