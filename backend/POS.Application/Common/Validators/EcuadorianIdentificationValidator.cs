namespace POS.Application.Common.Validators;

public static class EcuadorianIdentificationValidator
{
    private static readonly int[] Coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];

    public static bool IsValid(string? identificationNumber)
    {
        if (string.IsNullOrWhiteSpace(identificationNumber))
        {
            return false;
        }

        var id = identificationNumber.Trim();

        // Consumidor Final wildcard
        if (id == "9999999999")
        {
            return true;
        }

        // Must be exactly 10 digits
        if (id.Length != 10 || !id.All(char.IsDigit))
        {
            return false;
        }

        // Province: first 2 digits between 1 and 24, or 30
        int province = int.Parse(id.Substring(0, 2));
        if ((province < 1 || province > 24) && province != 30)
        {
            return false;
        }

        // Third digit: < 6 (natural persons)
        int thirdDigit = int.Parse(id[2].ToString());
        if (thirdDigit >= 6)
        {
            return false;
        }

        // Modulo 10 calculation
        int sum = 0;
        for (int i = 0; i < 9; i++)
        {
            int val = int.Parse(id[i].ToString()) * Coefficients[i];
            sum += val >= 10 ? val - 9 : val;
        }

        int calculated = (sum % 10 == 0) ? 0 : 10 - (sum % 10);
        return calculated == int.Parse(id[9].ToString());
    }

    public static bool ValidateCedula(string? id) => IsValid(id);
}
