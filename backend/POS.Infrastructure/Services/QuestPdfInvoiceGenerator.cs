using POS.Application.Common.Interfaces;
using POS.Application.DTOs;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace POS.Infrastructure.Services;

public class QuestPdfInvoiceGenerator : IInvoicePdfGenerator
{
    public byte[] GenerateInvoicePdf(SaleOrderResponseDto saleOrder)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(25, Unit.Point);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(9).FontColor(Colors.Grey.Darken3));

                page.Header().Element(header => ComposeHeader(header, saleOrder));
                page.Content().Element(content => ComposeContent(content, saleOrder));
                page.Footer().Element(ComposeFooter);
            });
        });

        return document.GeneratePdf();
    }

    private static void ComposeHeader(IContainer container, SaleOrderResponseDto order)
    {
        container.Row(row =>
        {
            row.RelativeItem().Column(column =>
            {
                column.Item().Text("SISTEMA DE FACTURACIÓN POS")
                    .FontSize(11)
                    .SemiBold()
                    .FontColor(Colors.Blue.Darken3);

                column.Item().Text("FACTURA / ORDEN DE VENTA")
                    .FontSize(16)
                    .ExtraBold()
                    .FontColor(Colors.Grey.Darken4);

                column.Item().Text($"N° Comprobante: {order.OrderNumber}")
                    .FontSize(11)
                    .Bold()
                    .FontColor(Colors.Blue.Darken2);
            });

            row.ConstantItem(220).Border(1).BorderColor(Colors.Grey.Lighten2).Background(Colors.Grey.Lighten4).Padding(8).Column(column =>
            {
                column.Item().Text(text =>
                {
                    text.Span("Fecha y Hora: ").SemiBold();
                    text.Span(order.IssueDate.ToString("dd/MM/yyyy HH:mm:ss"));
                });

                column.Item().Text(text =>
                {
                    text.Span("Vendedor: ").SemiBold();
                    text.Span(order.SellerName);
                });

                column.Item().Text(text =>
                {
                    text.Span("Estado: ").SemiBold();
                    text.Span("EMITIDA / PAGADA").FontColor(Colors.Green.Darken2).Bold();
                });
            });
        });
    }

    private static void ComposeContent(IContainer container, SaleOrderResponseDto order)
    {
        container.PaddingVertical(10).Column(column =>
        {
            // Customer Info Box
            column.Item().Border(1).BorderColor(Colors.Grey.Lighten2).Background(Colors.Grey.Lighten5).Padding(10).Column(customerCol =>
            {
                customerCol.Item().PaddingBottom(4).Text("DATOS DEL CLIENTE")
                    .FontSize(10)
                    .ExtraBold()
                    .FontColor(Colors.Blue.Darken3);

                customerCol.Item().Row(row =>
                {
                    row.RelativeItem(3).Text(t =>
                    {
                        t.Span("Cliente / Razón Social: ").SemiBold();
                        t.Span(string.IsNullOrWhiteSpace(order.CustomerName) ? "Consumidor Final" : order.CustomerName);
                    });

                    row.RelativeItem(2).Text(t =>
                    {
                        t.Span("Cédula / RUC: ").SemiBold();
                        t.Span(string.IsNullOrWhiteSpace(order.CustomerIdentification) ? "9999999999999" : order.CustomerIdentification);
                    });
                });

                customerCol.Item().PaddingTop(3).Row(row =>
                {
                    row.RelativeItem(3).Text(t =>
                    {
                        t.Span("Dirección: ").SemiBold();
                        t.Span(string.IsNullOrWhiteSpace(order.CustomerAddress) ? "No especificada" : order.CustomerAddress);
                    });

                    row.RelativeItem(2).Text(t =>
                    {
                        t.Span("Teléfono: ").SemiBold();
                        t.Span(string.IsNullOrWhiteSpace(order.CustomerPhoneNumber) ? "No especificado" : order.CustomerPhoneNumber);
                    });
                });

                customerCol.Item().PaddingTop(3).Row(row =>
                {
                    row.RelativeItem().Text(t =>
                    {
                        t.Span("Correo Electrónico: ").SemiBold();
                        t.Span(string.IsNullOrWhiteSpace(order.CustomerEmail) ? "No especificado" : order.CustomerEmail);
                    });
                });
            });

            column.Item().PaddingVertical(10);

            // Table of items
            column.Item().Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.ConstantColumn(25);
                    columns.ConstantColumn(75);
                    columns.RelativeColumn(3);
                    columns.ConstantColumn(45);
                    columns.ConstantColumn(70);
                    columns.ConstantColumn(45);
                    columns.ConstantColumn(70);
                });

                table.Header(header =>
                {
                    header.Cell().Element(HeaderStyle).AlignCenter().Text("#");
                    header.Cell().Element(HeaderStyle).Text("Código");
                    header.Cell().Element(HeaderStyle).Text("Descripción del Producto");
                    header.Cell().Element(HeaderStyle).AlignRight().Text("Cant.");
                    header.Cell().Element(HeaderStyle).AlignRight().Text("P. Unit.");
                    header.Cell().Element(HeaderStyle).AlignRight().Text("IVA %");
                    header.Cell().Element(HeaderStyle).AlignRight().Text("Subtotal");

                    static IContainer HeaderStyle(IContainer cell) =>
                        cell.Background(Colors.Blue.Darken3)
                            .Border(1)
                            .BorderColor(Colors.Blue.Darken4)
                            .Padding(4)
                            .DefaultTextStyle(x => x.FontColor(Colors.White).SemiBold().FontSize(8.5f));
                });

                for (var i = 0; i < order.Details.Count; i++)
                {
                    var item = order.Details[i];
                    var backgroundColor = i % 2 == 0 ? Colors.White : Colors.Grey.Lighten5;

                    table.Cell().Element(CellStyle).AlignCenter().Text((i + 1).ToString());
                    table.Cell().Element(CellStyle).Text(item.ProductCode);
                    table.Cell().Element(CellStyle).Text(item.ProductName);
                    table.Cell().Element(CellStyle).AlignRight().Text(item.Quantity.ToString());
                    table.Cell().Element(CellStyle).AlignRight().Text($"${item.UnitPrice:F2}");
                    table.Cell().Element(CellStyle).AlignRight().Text($"{item.TaxRate:F0}%");
                    table.Cell().Element(CellStyle).AlignRight().Text($"${item.Subtotal:F2}");

                    IContainer CellStyle(IContainer cell) =>
                        cell.Background(backgroundColor)
                            .BorderBottom(1)
                            .BorderColor(Colors.Grey.Lighten2)
                            .Padding(4)
                            .DefaultTextStyle(x => x.FontSize(8.5f));
                }
            });

            column.Item().PaddingTop(10);

            // Financial Summary Block
            column.Item().Row(row =>
            {
                row.RelativeItem().PaddingRight(15).Column(notesCol =>
                {
                    notesCol.Item().Text("INFORMACIÓN ADICIONAL").SemiBold().FontSize(8.5f).FontColor(Colors.Grey.Darken2);
                    notesCol.Item().Text("Forma de Pago: Efectivo / Transacción Electrónica").FontSize(8f);
                    notesCol.Item().Text("Moneda: Dólares de los Estados Unidos de América (USD)").FontSize(8f);
                    notesCol.Item().Text("Comprobante emitido sin enmendaduras.").FontSize(8f);
                });

                row.ConstantItem(220).Border(1).BorderColor(Colors.Grey.Lighten2).Table(summaryTable =>
                {
                    summaryTable.ColumnsDefinition(cols =>
                    {
                        cols.RelativeColumn(2);
                        cols.RelativeColumn(2);
                    });

                    summaryTable.Cell().Element(SummaryLabel).Text("Subtotal:");
                    summaryTable.Cell().Element(SummaryValue).Text($"${order.Subtotal:F2}");

                    summaryTable.Cell().Element(SummaryLabel).Text("IVA (15%):");
                    summaryTable.Cell().Element(SummaryValue).Text($"${order.TaxAmount:F2}");

                    summaryTable.Cell().Element(TotalLabel).Text("TOTAL A PAGAR:");
                    summaryTable.Cell().Element(TotalValue).Text($"${order.TotalAmount:F2} USD");

                    static IContainer SummaryLabel(IContainer cell) =>
                        cell.Background(Colors.Grey.Lighten4)
                            .BorderBottom(1)
                            .BorderColor(Colors.Grey.Lighten2)
                            .Padding(4)
                            .DefaultTextStyle(x => x.SemiBold().FontSize(9));

                    static IContainer SummaryValue(IContainer cell) =>
                        cell.Background(Colors.White)
                            .BorderBottom(1)
                            .BorderColor(Colors.Grey.Lighten2)
                            .Padding(4)
                            .AlignRight()
                            .DefaultTextStyle(x => x.SemiBold().FontSize(9));

                    static IContainer TotalLabel(IContainer cell) =>
                        cell.Background(Colors.Blue.Darken3)
                            .Padding(6)
                            .DefaultTextStyle(x => x.ExtraBold().FontSize(10).FontColor(Colors.White));

                    static IContainer TotalValue(IContainer cell) =>
                        cell.Background(Colors.Blue.Darken3)
                            .Padding(6)
                            .AlignRight()
                            .DefaultTextStyle(x => x.ExtraBold().FontSize(10).FontColor(Colors.White));
                });
            });
        });
    }

    private static void ComposeFooter(IContainer container)
    {
        container.BorderTop(1).BorderColor(Colors.Grey.Lighten2).PaddingTop(5).Row(row =>
        {
            row.RelativeItem().Text("Comprobante de venta emitido con fines demostrativos y académicos por el Sistema POS. Sin validez tributaria ni contable.")
                .FontSize(7.5f)
                .Italic()
                .FontColor(Colors.Grey.Medium);

            row.ConstantItem(120).AlignRight().Text(text =>
            {
                text.Span("Página ").FontSize(8);
                text.CurrentPageNumber().FontSize(8);
                text.Span(" de ").FontSize(8);
                text.TotalPages().FontSize(8);
            });
        });
    }
}
