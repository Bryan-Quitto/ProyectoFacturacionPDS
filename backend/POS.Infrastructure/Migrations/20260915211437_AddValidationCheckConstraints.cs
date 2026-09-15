using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace POS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddValidationCheckConstraints : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddCheckConstraint(
                name: "CK_SaleOrder_Amounts_NonNegative",
                table: "SaleOrders",
                sql: "\"Subtotal\" >= 0 AND \"TaxAmount\" >= 0 AND \"TotalAmount\" >= 0");

            migrationBuilder.AddCheckConstraint(
                name: "CK_SaleOrderDetail_Amounts_NonNegative",
                table: "SaleOrderDetails",
                sql: "\"UnitPrice\" >= 0 AND \"Subtotal\" >= 0 AND \"Total\" >= 0");

            migrationBuilder.AddCheckConstraint(
                name: "CK_SaleOrderDetail_Quantity_Positive",
                table: "SaleOrderDetails",
                sql: "\"Quantity\" > 0");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Product_Code_NotEmpty",
                table: "Products",
                sql: "trim(\"Code\") <> ''");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Product_Name_NotEmpty",
                table: "Products",
                sql: "trim(\"Name\") <> ''");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Product_TaxRate_Range",
                table: "Products",
                sql: "\"TaxRate\" >= 0 AND \"TaxRate\" <= 100");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Product_UnitPrice_NonNegative",
                table: "Products",
                sql: "\"UnitPrice\" >= 0");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Customer_Address_NotEmpty",
                table: "Customers",
                sql: "trim(\"Address\") <> ''");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Customer_Email_Format",
                table: "Customers",
                sql: "\"Email\" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Customer_FullName_NotEmpty",
                table: "Customers",
                sql: "trim(\"FullName\") <> ''");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Customer_Identification_DigitsOnly",
                table: "Customers",
                sql: "\"IdentificationNumber\" ~ '^[0-9]{10,13}$'");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Customer_PhoneNumber_DigitsOnly",
                table: "Customers",
                sql: "\"PhoneNumber\" ~ '^[0-9]{7,15}$'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_SaleOrder_Amounts_NonNegative",
                table: "SaleOrders");

            migrationBuilder.DropCheckConstraint(
                name: "CK_SaleOrderDetail_Amounts_NonNegative",
                table: "SaleOrderDetails");

            migrationBuilder.DropCheckConstraint(
                name: "CK_SaleOrderDetail_Quantity_Positive",
                table: "SaleOrderDetails");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Product_Code_NotEmpty",
                table: "Products");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Product_Name_NotEmpty",
                table: "Products");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Product_TaxRate_Range",
                table: "Products");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Product_UnitPrice_NonNegative",
                table: "Products");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Customer_Address_NotEmpty",
                table: "Customers");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Customer_Email_Format",
                table: "Customers");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Customer_FullName_NotEmpty",
                table: "Customers");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Customer_Identification_DigitsOnly",
                table: "Customers");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Customer_PhoneNumber_DigitsOnly",
                table: "Customers");
        }
    }
}
