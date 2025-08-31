import { element, renderToString } from "@shun-shobon/littlexml";
import type { Company, Invoices } from "~/types/invoice";

export class ExporterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExporterError";
  }
}

export const createPayload = (
  company: Company["data"],
  data: Invoices["data"],
  now: string
) => {
  data.forEach((invoice) => {
    if (!invoice.client.vat_number) {
      throw new ExporterError(
        `Client ${invoice.client.name} does not have a VAT number`
      );
    }

    if (!invoice.client.contacts[0].email) {
      throw new ExporterError(
        `Client ${invoice.client.name} does not have an email`
      );
    }
  });

  // calculation selected disini
  return {
    vat: company[0].settings.vat_number,
    idtku: company[0].settings.vat_number + "000000",
    date: now,
    invoices: data.map((invoice) => ({
      id: invoice.id,
      client: {
        name: invoice.client.name,
        email: invoice.client.contacts[0].email,
        vat: invoice.client.vat_number,
        idtku: invoice.client.vat_number + "000000",
      },
      items: invoice.line_items.map((item) => {
        const total = item.cost * item.quantity;
        const discount = total * (item.discount / 100);
        const taxBasePrice = total - discount;
        const otherTaxBasePrice = taxBasePrice * (11 / 12);

        return {
          name: item.product_key,
          price: item.cost.toFixed(2), // harga per barang sebelum PPN dan diskon
          quantity: item.quantity, // jumlah barang
          total: total.toFixed(2), // harga total barang sebelum PPN dan diskon
          discount: discount.toFixed(2), // diskon barang
          taxBasePrice: taxBasePrice.toFixed(2), // harga total barang setelah diskon
          otherTaxBasePrice: otherTaxBasePrice.toFixed(2), // harga 11/12
          vat: (otherTaxBasePrice * (12 / 100)).toFixed(2), // ppn barang (12%)
        };
      }),
    })),
  };
};

export const createPreview = (data: Invoices["data"]) => {
  return data.map((invoice) => ({
    id: invoice.id,
    client: invoice.client.name,
    amount: invoice.amount, // total setelah PPN dan diskon (buat frontend doang)
    total_taxes: invoice.total_taxes, // total PPN (buat frontend doang)
    date: invoice.date,
  }));
};

export type Preview = ReturnType<typeof createPreview>;

export const generateXML = (payload: ReturnType<typeof createPayload>) => {
  const root = element("TaxInvoiceBulk")
    .attr("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance")
    .attr("xsi:noNamespaceSchemaLocation", "TaxInvoice.xsd")

    .child(
      element("TIN").text(payload.vat),
      element("ListOfTaxInvoice").child(
        ...payload.invoices.map((invoice) =>
          element("TaxInvoice").child(
            element("TaxInvoiceDate").text(payload.date),
            element("TaxInvoiceOpt").text("Normal"),
            element("TrxCode").text("04"),
            element("AddInfo"),
            element("CustomDoc"),
            element("RefDesc"),
            element("FacilityStamp"),
            element("SellerIDTKU").text(payload.idtku),
            element("BuyerTin").text(invoice.client.vat),
            element("BuyerDocument").text("TIN"),
            element("BuyerCountry").text("IND"),
            element("BuyerDocumentNumber"),
            element("BuyerName"),
            element("BuyerAdress"),
            element("BuyerEmail").text(invoice.client.email),
            element("BuyerIDTKU").text(invoice.client.idtku),
            element("ListOfGoodService").child(
              ...invoice.items.map((item) =>
                element("GoodService").child(
                  element("Opt").text("A"),
                  element("Code").text("000000"),
                  element("Name").text(item.name),
                  element("Unit").text("UM.0021"),
                  element("Price").text(item.price),
                  element("Qty").text(item.quantity.toString()),
                  element("TotalDiscount").text(item.discount),
                  element("TaxBase").text(item.taxBasePrice),
                  element("OtherTaxBase").text(item.otherTaxBasePrice),
                  element("VATRate").text("12"),
                  element("VAT").text(item.vat),
                  element("STLGRate").text("0"),
                  element("STLG").text("0")
                )
              )
            )
          )
        )
      )
    );

  return renderToString(root, { indent: 4 });
};
