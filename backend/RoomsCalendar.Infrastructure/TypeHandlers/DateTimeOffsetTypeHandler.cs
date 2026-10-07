using System.Data;
using Dapper;

[module: TypeHandler(
    typeof(DateTimeOffset),
    typeof(RoomsCalendar.Infrastructure.TypeHandlers.DateTimeOffsetTypeHandler))]

namespace RoomsCalendar.Infrastructure.TypeHandlers;

public class DateTimeOffsetTypeHandler : SqlMapper.TypeHandler<DateTimeOffset>
{
    public override void SetValue(IDbDataParameter parameter, DateTimeOffset value)
    {
        parameter.Value = value;
        parameter.DbType = DbType.DateTimeOffset;
    }

    public override DateTimeOffset Parse(object value)
    {
        return value switch
        {
            DateTimeOffset dto => dto,
            DateTime dt => new DateTimeOffset(dt),
            string s => DateTimeOffset.Parse(s),
            _ => Convert.ToDateTime(value)
        };
    }
}
