import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useBzTheme } from '../constants/BzTheme';
import type { PedidoApartadoData } from './VistaAgendarCliente';

/* =====================================================================
   Utilidades
   ===================================================================== */

const mxn = (n: number) => `$${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

function barrasDeFolio(folio: string): number[] {
  const base = folio.replace(/\D/g, '').padEnd(4, '0');
  const barras: number[] = [];
  for (let i = 0; i < 24; i++) {
    const d = Number(base[i % base.length]);
    barras.push(((d + i * 3) % 4) + 1);
  }
  return barras;
}

/* =====================================================================
   Props
   ===================================================================== */

type Props = {
  pedido: PedidoApartadoData;
  clienteNombre?: string;
  onCerrar: () => void;
  textoBotonPrincipal?: string;
  textoBotonSecundario?: string;
  onSecundario?: () => void;
};

/* =====================================================================
   Componente: ComprobantePedidoCard (Ticket de compra / apartado)
   ===================================================================== */

export function ComprobantePedidoCard({
  pedido,
  clienteNombre = 'Cliente BarberZone',
  onCerrar,
  textoBotonPrincipal = 'Listo, cerrar ticket',
  textoBotonSecundario,
  onSecundario,
}: Props) {
  const { colors } = useBzTheme();
  const barras = useMemo(() => barrasDeFolio(pedido.folio), [pedido.folio]);
  const totalUnidades = useMemo(
    () => pedido.lineas.reduce((acc, item) => acc + item.cantidad, 0),
    [pedido.lineas],
  );

  return (
    <View style={[styles.ticketCard, { backgroundColor: colors.BzCard, borderColor: colors.BzBorder }]}>
      {/* Encabezado */}
      <View style={styles.topRow}>
        <View style={[styles.badgeOk, { backgroundColor: colors.BzText }]}>
          <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
            <Path
              d="M5 13l4 4L19 7"
              stroke={colors.BzBg}
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <Text style={[styles.badgeTexto, { color: colors.BzBg }]}>PEDIDO APARTADO</Text>
        </View>
        <Text style={[styles.folioTexto, { color: colors.BzMuted }]}>#{pedido.folio}</Text>
      </View>

      <Text style={[styles.marcaTexto, { color: colors.BzMuted }]}>
        TICKET DE ENTREGA · BARBERZONE
      </Text>
      <Text style={[styles.sucursalTitulo, { color: colors.BzText }]}>{pedido.sucursal}</Text>

      {/* Línea punteada tipo ticket */}
      <View style={styles.dividerWrap}>
        <View style={[styles.muescaIzq, { backgroundColor: colors.BzBg }]} />
        <View style={[styles.lineaPunteada, { borderColor: colors.BzBorder }]} />
        <View style={[styles.muescaDer, { backgroundColor: colors.BzBg }]} />
      </View>

      {/* Datos generales */}
      <View style={styles.gridRow}>
        <View style={styles.datoBox}>
          <Text style={[styles.label, { color: colors.BzMuted }]}>CLIENTE</Text>
          <Text style={[styles.valor, { color: colors.BzText }]} numberOfLines={1}>
            {clienteNombre}
          </Text>
        </View>
        <View style={styles.datoBox}>
          <Text style={[styles.label, { color: colors.BzMuted }]}>FECHA DE COMPRA</Text>
          <Text style={[styles.valor, { color: colors.BzText }]}>{pedido.creadoEn}</Text>
        </View>
      </View>

      <View style={[styles.gridRow, { marginTop: 12 }]}>
        <View style={styles.datoBox}>
          <Text style={[styles.label, { color: colors.BzMuted }]}>ARTÍCULOS</Text>
          <Text style={[styles.valor, { color: colors.BzText }]}>
            {totalUnidades} {totalUnidades === 1 ? 'producto' : 'productos'}
          </Text>
        </View>
        <View style={styles.datoBox}>
          <Text style={[styles.label, { color: colors.BzMuted }]}>MÉTODO DE PAGO</Text>
          <Text style={[styles.valor, { color: colors.BzText }]}>En mostrador</Text>
        </View>
      </View>

      {/* Desglose de productos pedidos */}
      <View style={[styles.productosBox, { backgroundColor: colors.BzCardInner, borderColor: colors.BzBorder }]}>
        <Text style={[styles.label, { color: colors.BzMuted, marginBottom: 8 }]}>
          DETALLE DE PRODUCTOS
        </Text>

        <View style={{ gap: 8 }}>
          {pedido.lineas.map((linea) => (
            <View key={linea.id} style={styles.lineaProductoRow}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
                  {linea.nombre}
                </Text>
                <Text style={{ color: colors.BzMuted, fontSize: 11, marginTop: 1 }}>
                  {linea.cantidad} × {mxn(linea.precio)} c/u
                </Text>
              </View>
              <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
                {mxn(linea.precio * linea.cantidad)}
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.totalLinea, { borderTopColor: colors.BzBorder }]}>
          <Text style={{ color: colors.BzMuted, fontSize: 12, fontWeight: '600' }}>TOTAL A PAGAR</Text>
          <Text style={{ color: colors.BzText, fontSize: 20, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
            {mxn(pedido.total)}
          </Text>
        </View>
      </View>

      {/* Código de barras de verificación */}
      <View style={[styles.codigoBox, { backgroundColor: colors.BzBg, borderColor: colors.BzBorder }]}>
        <View style={styles.barrasRow}>
          {barras.map((w, idx) => (
            <View
              key={idx}
              style={{
                width: w,
                height: 28,
                backgroundColor: colors.BzText,
                opacity: idx % 3 === 0 ? 0.9 : 0.55,
              }}
            />
          ))}
        </View>
        <Text style={[styles.notaRecepcion, { color: colors.BzMuted }]}>
          Presenta este ticket en {pedido.sucursal} para recoger tus productos
        </Text>
      </View>

      {/* Botón principal */}
      <Pressable
        onPress={onCerrar}
        style={({ pressed }) => [
          styles.btnPrimario,
          { backgroundColor: colors.BzText, marginTop: 18, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <Text style={[styles.btnPrimarioTexto, { color: colors.BzBg }]}>{textoBotonPrincipal}</Text>
      </Pressable>

      {/* Botón secundario opcional */}
      {!!textoBotonSecundario && !!onSecundario && (
        <Pressable
          onPress={onSecundario}
          style={({ pressed }) => [
            styles.btnSecundario,
            { borderColor: colors.BzBorder, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={{ color: colors.BzText, fontSize: 13, fontWeight: '600' }}>
            {textoBotonSecundario}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export default ComprobantePedidoCard;

/* =====================================================================
   Estilos
   ===================================================================== */

const styles = StyleSheet.create({
  ticketCard: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 22,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeOk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  badgeTexto: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  folioTexto: {
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  marcaTexto: {
    fontSize: 10,
    letterSpacing: 1.6,
    fontWeight: '500',
    marginTop: 16,
  },
  sucursalTitulo: {
    fontSize: 22,
    fontWeight: '600',
    marginTop: 4,
  },
  dividerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    marginHorizontal: -22,
  },
  muescaIzq: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginLeft: -9,
  },
  lineaPunteada: {
    flex: 1,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
  },
  muescaDer: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: -9,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  datoBox: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '600',
  },
  valor: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 3,
  },
  productosBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  lineaProductoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLinea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  codigoBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  barrasRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  notaRecepcion: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
  btnPrimario: {
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimarioTexto: {
    fontSize: 14,
    fontWeight: '600',
  },
  btnSecundario: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
});