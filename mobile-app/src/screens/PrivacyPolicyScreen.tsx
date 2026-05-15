import React from 'react'
import { View, ScrollView, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { AppText } from '../components/ui/AppText'
import { AppButton } from '../components/ui/AppButton'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'

const FULL_POLICY_URL = 'https://codexpy.com/odontopacientes/privacidad.html'

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation<any>()

  const openFullPolicy = () => {
    Linking.openURL(FULL_POLICY_URL).catch(() => {})
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.brandNavy} />
        </TouchableOpacity>
        <AppText variant="h3" weight="bold" color="brandNavy">
          Política de Privacidad
        </AppText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="caption" color="textSecondary" style={styles.meta}>
          Última actualización: 15 de mayo de 2026
        </AppText>

        <Section title="1. Quiénes somos">
          OdontoPacientes es una aplicación destinada a estudiantes y docentes
          de odontología para gestionar pacientes y procedimientos clínicos en
          el marco académico de una cátedra universitaria. El responsable del
          tratamiento es OdontoPacientes (codexpy.com/odontopacientes).
        </Section>

        <Section title="2. Qué datos recolectamos">
          {`Recolectamos los siguientes datos:

• Datos de identificación del usuario: nombre, apellido, correo electrónico, teléfono, ciudad, institución educativa, foto de perfil.
• Datos de pacientes ingresados por el usuario: nombre, datos de contacto, edad, ficha clínica y odontograma, fotografías clínicas.
• Datos técnicos: identificadores de cuenta, fecha de creación, registros de uso para fines de seguridad y soporte.

No recolectamos datos para publicidad, ni rastreamos al usuario a través de otras apps o sitios web.`}
        </Section>

        <Section title="3. Para qué los usamos">
          {`Usamos los datos exclusivamente para:

• Permitir el funcionamiento de la app (gestión de pacientes, procedimientos y odontogramas).
• Autenticación y seguridad de la cuenta.
• Soporte al usuario.
• Cumplimiento de obligaciones legales aplicables.`}
        </Section>

        <Section title="4. Con quién los compartimos">
          {`No vendemos ni alquilamos datos personales a terceros.

Los datos clínicos de pacientes son accesibles únicamente por el usuario (estudiante o docente) que los ingresa, los coordinadores académicos de su cátedra, y administradores autorizados de OdontoPacientes.

Utilizamos proveedores de infraestructura (hosting) que procesan datos por cuenta nuestra bajo acuerdos de confidencialidad.`}
        </Section>

        <Section title="5. Datos sensibles de salud">
          {`Los datos de salud de pacientes son tratados como información sensible. El usuario que los carga es responsable de haber obtenido el consentimiento previo del paciente para registrar y almacenar dicha información en el contexto académico-clínico.

OdontoPacientes actúa como encargado del tratamiento; la cátedra/institución educativa actúa como responsable conforme a la normativa aplicable.`}
        </Section>

        <Section title="6. Conservación de datos">
          {`Conservamos los datos mientras la cuenta esté activa o sean necesarios para las finalidades descritas. Los datos pueden conservarse por periodos adicionales para cumplir obligaciones legales o resolver disputas.

Puedes solicitar la eliminación de tu cuenta y datos personales en cualquier momento escribiendo a privacidad@codexpy.com.`}
        </Section>

        <Section title="7. Tus derechos">
          {`Puedes ejercer en cualquier momento los siguientes derechos:

• Acceso a tus datos.
• Rectificación de datos inexactos.
• Supresión (derecho al olvido).
• Oposición al tratamiento.
• Portabilidad.

Para ejercerlos, contáctanos a: privacidad@codexpy.com`}
        </Section>

        <Section title="8. Seguridad">
          Aplicamos medidas técnicas y organizativas razonables para proteger
          los datos: cifrado en tránsito (HTTPS), almacenamiento seguro,
          control de accesos por roles y registros de auditoría.
        </Section>

        <Section title="9. Menores de edad">
          La app está dirigida a usuarios mayores de edad (estudiantes y
          docentes universitarios). Los pacientes menores de edad solo pueden
          ser registrados con el consentimiento de su representante legal.
        </Section>

        <Section title="10. Cambios en esta política">
          Podemos actualizar esta política. Cuando lo hagamos, publicaremos la
          versión actualizada en esta misma sección y, cuando corresponda, te
          notificaremos dentro de la app.
        </Section>

        <Section title="11. Contacto">
          {`Para cualquier consulta relacionada con privacidad:

📧 privacidad@codexpy.com
🌐 codexpy.com/odontopacientes`}
        </Section>

        <View style={styles.footer}>
          <AppButton
            title="Ver versión completa en el navegador"
            onPress={openFullPolicy}
            variant="outline"
            fullWidth
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="h3" weight="bold" color="brandNavy" style={styles.sectionTitle}>
        {title}
      </AppText>
      <AppText variant="body" color="textPrimary" style={styles.sectionBody}>
        {children}
      </AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  meta: {
    marginBottom: spacing.lg,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
  },
  sectionBody: {
    lineHeight: 22,
  },
  footer: {
    marginTop: spacing.lg,
  },
})
