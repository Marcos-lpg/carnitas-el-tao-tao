using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CarnitasTaoTao.Core.Entities
{
    [Table("insumos")]
    public class Insumo
    {
        [Key]
        [Column("Id")]
        public int Id { get; set; }

        [Column("Fecha")]
        public DateTime Fecha { get; set; } = DateTime.Now;

        [Column("TipoInsumo")]
        public string TipoInsumo { get; set; } = string.Empty;

        [Column("Monto")]
        public decimal Monto { get; set; }

        // Agrega esta propiedad para vincular el gasto a la caja activa
        [Column("CajaTurnoId")]
        public int CajaTurnoId { get; set; }
    }
}