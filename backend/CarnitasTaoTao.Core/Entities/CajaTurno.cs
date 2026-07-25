using System;
using System.Collections.Generic;

namespace CarnitasTaoTao.Core.Entities
{
    public class CajaTurno
    {
        public int Id { get; set; }
        public DateTime FechaApertura { get; set; } = DateTime.Now;
        public DateTime? FechaCierre { get; set; }
        public decimal FondoInicial { get; set; }
        public decimal TotalVentas { get; set; } = 0;
        public decimal TotalGastos { get; set; } = 0;
        public decimal EfectivoEnCaja { get; set; } = 0; // Calculado al cerrar
        public bool EstaAbierta { get; set; } = true;

        // Relaciones con las ventas y los gastos del turno
        public ICollection<Venta> Ventas { get; set; } = new List<Venta>();
        public ICollection<Gasto> Gastos { get; set; } = new List<Gasto>();
    }
}