// pages/api/payment/[id].ts
import { NextApiRequest, NextApiResponse } from "next";
import { PaymentService } from "../../../services/PaymentService";
import { createClient } from "@/lib/supabase/server";

const supabase = createClient();
const paymentService = new PaymentService(supabase);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === "GET") {
    try {
      const payment = await paymentService.getPaymentById(id as string);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      res.status(200).json(payment);
    } catch (error) {
      res.status(500).json({ message: error });
    }
  } else if (req.method === "PUT") {
    try {
      const updatedData = req.body;
      const updatedPayment = await paymentService.updatePayment(
        id as string,
        updatedData
      );
      if (!updatedPayment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      res.status(200).json(updatedPayment);
    } catch (error) {
      res.status(500).json({ message: error });
    }
  } else if (req.method === "DELETE") {
    try {
      await paymentService.deletePayment(id as string);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: error });
    }
  } else {
    res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
