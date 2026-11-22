import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { useBzTheme } from '../constants/BzTheme';

export const Etiqueta: React.FC<{ texto: string; size?: number }> = ({ texto, size = 10 }) => {
  const { colors } = useBzTheme();
  return <Text style={{ color: colors.BzMuted, fontSize: size, letterSpacing: 1.5 }}>{texto}</Text>;
};

export const Fila: React.FC<{ children: React.ReactNode; style?: ViewStyle }> = ({ children, style }) => (
  <View style={[{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, style]}>
    {children}
  </View>
);

export const Divisor: React.FC = () => {
  const { colors } = useBzTheme();
  return <View style={{ height: 1, backgroundColor: colors.BzBorder }} />;
};

export const Tarjeta: React.FC<{
  children: React.ReactNode;
  padding?: number;
  gap?: number;
  radius?: number;
  borderColor?: string;
  fondo?: 'card' | 'bg';
  style?: ViewStyle;
}> = ({ children, padding = 14, gap = 8, radius = 14, borderColor, fondo = 'card', style }) => {
  const { colors } = useBzTheme();
  return (
    <View
      style={[
        {
          backgroundColor: fondo === 'card' ? colors.BzCard : colors.BzBg,
          borderColor: borderColor ?? colors.BzBorder,
          borderWidth: 1,
          borderRadius: radius,
          padding,
          gap,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

export const Chip: React.FC<{
  activo: boolean;
  onPress: () => void;
  radius?: number;
  padH?: number;
  padV?: number;
  inactivoBg?: 'card' | 'bg';
  style?: ViewStyle;
  children: (fg: string) => React.ReactNode;
}> = ({ activo, onPress, radius = 20, padH = 12, padV = 6, inactivoBg = 'card', style, children }) => {
  const { colors } = useBzTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          borderRadius: radius,
          paddingHorizontal: padH,
          paddingVertical: padV,
          borderWidth: 1,
          backgroundColor: activo ? colors.BzText : inactivoBg === 'bg' ? colors.BzBg : colors.BzCard,
          borderColor: activo ? colors.BzText : colors.BzBorder,
        },
        style,
      ]}
    >
      {children(activo ? colors.BzBg : colors.BzText)}
    </Pressable>
  );
};

export const ChipTexto: React.FC<{
  texto: string;
  activo: boolean;
  onPress: () => void;
  size?: number;
  padH?: number;
  padV?: number;
  apagado?: boolean;
  negrita?: boolean;
  inactivoBg?: 'card' | 'bg';
  centrado?: boolean;
  style?: ViewStyle;
}> = ({ texto, activo, onPress, size = 12, padH = 12, padV = 6, apagado, negrita, inactivoBg, centrado, style }) => {
  const { colors } = useBzTheme();
  return (
    <Chip activo={activo} onPress={onPress} padH={padH} padV={padV} inactivoBg={inactivoBg} style={style}>
      {(fg) => (
        <Text
          style={{
            color: activo ? fg : apagado ? colors.BzMuted : fg,
            fontSize: size,
            fontWeight: negrita && activo ? '600' : '400',
            textAlign: centrado ? 'center' : 'left',
          }}
        >
          {texto}
        </Text>
      )}
    </Chip>
  );
};

export const Segmentado: React.FC<{
  opciones: string[];
  valor: string;
  onChange: (v: string) => void;
  size?: number;
  padV?: number;
  ajustado?: boolean;
  style?: ViewStyle;
}> = ({ opciones, valor, onChange, size = 12, padV = 8, ajustado, style }) => {
  const { colors } = useBzTheme();
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          borderRadius: 10,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.BzBorder,
          backgroundColor: colors.BzCard,
        },
        ajustado ? { alignSelf: 'flex-start' } : null,
        style,
      ]}
    >
      {opciones.map((o) => {
        const activo = o === valor;
        return (
          <Pressable
            key={o}
            onPress={() => onChange(o)}
            style={{
              flex: ajustado ? undefined : 1,
              paddingHorizontal: ajustado ? 12 : 0,
              paddingVertical: padV,
              alignItems: 'center',
              backgroundColor: activo ? colors.BzText : 'transparent',
            }}
          >
            <Text
              style={{
                color: activo ? colors.BzBg : colors.BzMuted,
                fontSize: size,
                fontWeight: activo ? '600' : '400',
              }}
            >
              {o}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

export const BotonPrimario: React.FC<{
  texto: string;
  onPress: () => void;
  height?: number;
  disabled?: boolean;
  semibold?: boolean;
}> = ({ texto, onPress, height = 48, disabled, semibold = true }) => {
  const { colors } = useBzTheme();
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={{
        width: '100%',
        height,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.BzText,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Text style={{ color: colors.BzBg, fontSize: 14, fontWeight: semibold ? '600' : '500' }}>{texto}</Text>
    </Pressable>
  );
};

export const BotonSecundario: React.FC<{
  texto: string;
  onPress: () => void;
  height?: number;
  color?: string;
  borderColor?: string;
}> = ({ texto, onPress, height = 46, color, borderColor }) => {
  const { colors } = useBzTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: '100%',
        height,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: borderColor ?? colors.BzBorder,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: color ?? colors.BzText, fontSize: 14 }}>{texto}</Text>
    </Pressable>
  );
};

export const BotonMini: React.FC<{ texto: string; onPress: () => void; size?: number }> = ({
  texto,
  onPress,
  size = 14,
}) => {
  const { colors } = useBzTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.BzBorder,
        minWidth: 36,
        alignItems: 'center',
      }}
    >
      <Text style={{ color: colors.BzText, fontSize: size }}>{texto}</Text>
    </Pressable>
  );
};

export const Volver: React.FC<{ onPress: () => void; texto?: string }> = ({ onPress, texto = '‹ Volver' }) => {
  const { colors } = useBzTheme();
  return (
    <Pressable onPress={onPress} style={{ alignSelf: 'flex-start', paddingVertical: 4 }}>
      <Text style={{ color: colors.BzMuted, fontSize: 13 }}>{texto}</Text>
    </Pressable>
  );
};

export const Titulo: React.FC<{ texto: string; size?: number }> = ({ texto, size = 20 }) => {
  const { colors } = useBzTheme();
  return <Text style={{ color: colors.BzText, fontSize: size, fontWeight: '300' }}>{texto}</Text>;
};

export const BzSheet: React.FC<{ visible: boolean; onDismiss: () => void; children: React.ReactNode }> = ({
  visible,
  onDismiss,
  children,
}) => {
  const { colors } = useBzTheme();
  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      presentationStyle="overFullScreen"
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(0,0,0,0.68)',
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={onDismiss} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View
            style={{
              backgroundColor: colors.BzCard,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: 24,
              maxHeight: '90%',
            }}
          >
            <View
              style={{
                width: 38,
                height: 4,
                borderRadius: 2,
                alignSelf: 'center',
                marginBottom: 14,
                backgroundColor: colors.BzBorder,
              }}
            />
            <ScrollView
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingBottom: 36 }}
            >
              {children}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export const CampoTexto: React.FC<{
  valor: string;
  onCambio: (t: string) => void;
  placeholder?: string;
  label?: string;
  error?: string | null;
  teclado?: TextInputProps['keyboardType'];
  oculto?: boolean;
  multiline?: boolean;
  fondo?: 'card' | 'bg';
}> = ({ valor, onCambio, placeholder, label, error, teclado = 'default', oculto, multiline, fondo = 'bg' }) => {
  const { colors } = useBzTheme();
  const [foco, setFoco] = useState(false);
  return (
    <View style={{ gap: 4 }}>
      {label ? <Text style={{ color: error ? colors.BzDanger : colors.BzMuted, fontSize: 12 }}>{label}</Text> : null}
      <TextInput
        value={valor}
        onChangeText={onCambio}
        placeholder={placeholder}
        placeholderTextColor={colors.BzMuted}
        keyboardType={teclado}
        secureTextEntry={oculto}
        multiline={multiline}
        autoCapitalize="none"
        onFocus={() => setFoco(true)}
        onBlur={() => setFoco(false)}
        style={{
          minHeight: multiline ? 80 : 48,
          borderWidth: 1,
          borderRadius: 10,
          paddingHorizontal: 14,
          paddingVertical: multiline ? 10 : 0,
          textAlignVertical: multiline ? 'top' : 'center',
          fontSize: 14,
          color: colors.BzText,
          backgroundColor: fondo === 'bg' ? colors.BzBg : colors.BzCard,
          borderColor: error ? colors.BzDanger : foco ? colors.BzText : colors.BzBorder,
        }}
      />
      {error ? <Text style={{ color: colors.BzDanger, fontSize: 12 }}>{error}</Text> : null}
    </View>
  );
};