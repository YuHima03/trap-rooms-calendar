using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Dapper;
using RoomsCalendar.Share.Domain;

namespace RoomsCalendar.Infrastructure.Repository;

sealed class CalendarStreamDto
{
    [Column("id"), UseColumnAttribute]
    [Key]
    public Guid Id { get; set; }

    [Column("username"), UseColumnAttribute]
    public required string Username { get; set; }

    [Column("token"), UseColumnAttribute]
    public required string Token { get; set; }

    [Column("created_at"), UseColumnAttribute]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public DateTimeOffset CreatedAt { get; set; }

    [Column("updated_at"), UseColumnAttribute]
    [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
    public DateTimeOffset UpdatedAt { get; set; }

    public CalendarStream ToDomain()
    {
        return new CalendarStream(
            Id, Username, Token, CreatedAt, UpdatedAt
        );
    }
}

