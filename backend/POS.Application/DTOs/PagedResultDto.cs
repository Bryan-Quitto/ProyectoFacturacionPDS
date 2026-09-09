namespace POS.Application.DTOs;

public record PagedResultDto<T>(IReadOnlyList<T> Items, int TotalCount, int PageNumber, int PageSize, int TotalPages)
{
    public static PagedResultDto<T> Create(IReadOnlyList<T> items, int totalCount, int pageNumber, int pageSize) =>
        new(items, totalCount, pageNumber, pageSize, pageSize > 0 ? (int)Math.Ceiling(totalCount / (double)pageSize) : 0);
}
