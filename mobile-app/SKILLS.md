# OdontoPacientes Mobile - Skills Matrix

## 🎯 Skills Necesarios para el Éxito del Proyecto

### 1. FRONTEND MOBILE (React Native + Expo)
**Responsabilidad:** Desarrollo de interfaces móviles cross-platform  
**Señales de "Bien Implementado":**
- ✅ Componentes reutilizables y tipados con TypeScript
- ✅ Navegación fluida sin crashes ni warnings
- ✅ Compatible con Expo Go (sin librerías nativas)
- ✅ Responsive en diferentes tamaños de pantalla
- ✅ SafeAreaView para notch de iOS
- ✅ Gestos naturales (swipe, pull-to-refresh)

**Anti-patterns a evitar:**
- ❌ Inline styles en lugar de StyleSheet
- ❌ Renderizado condicional sin loading states
- ❌ Acceso directo a APIs sin service layer

### 2. GESTIÓN DE ESTADO
**Responsabilidad:** Mantener datos consistentes entre pantallas  
**Herramientas:** Zustand (global), React Query (cache), useState (local)  
**Señales de "Bien Implementado":**
- ✅ Single source of truth para cada dato
- ✅ Sin duplicación de estado entre stores
- ✅ Cache invalidation automática en mutaciones
- ✅ Optimistic updates donde sea apropiado
- ✅ Persistencia de auth token en AsyncStorage

**Anti-patterns a evitar:**
- ❌ Props drilling excesivo
- ❌ Estado duplicado en múltiples componentes
- ❌ Mezclar estado local con global innecesariamente

### 3. NAVEGACIÓN
**Responsabilidad:** Flujo entre pantallas intuitivo y sin bugs  
**Herramienta:** React Navigation v6  
**Señales de "Bien Implementado":**
- ✅ Deep linking funcionando
- ✅ Back button behavior correcto en Android
- ✅ Tabs con lazy loading
- ✅ Stack navigators anidados correctamente
- ✅ Params tipados entre pantallas
- ✅ Reset de stack al logout

**Anti-patterns a evitar:**
- ❌ Navegación imperativa sin tipos
- ❌ Memory leaks por listeners no limpiados
- ❌ Circular dependencies en navigators

### 4. INTEGRACIÓN CON BACKEND (API REST)
**Responsabilidad:** Comunicación confiable con Laravel API  
**Señales de "Bien Implementado":**
- ✅ Interceptors para auth token automático
- ✅ Manejo de errores 401 con logout
- ✅ Retry logic para errores de red
- ✅ Loading/error states en cada llamada
- ✅ Tipos TypeScript para responses
- ✅ Base URL configurable por ambiente

**Anti-patterns a evitar:**
- ❌ Hardcodear URLs de API
- ❌ No manejar timeouts
- ❌ Logs de datos sensibles

### 5. TESTING & QA
**Responsabilidad:** Garantizar calidad y prevenir regresiones  
**Señales de "Bien Implementado":**
- ✅ Unit tests para lógica de negocio
- ✅ Integration tests para flujos críticos
- ✅ Snapshot tests para componentes UI
- ✅ E2E tests con Detox (opcional)
- ✅ Coverage > 70% en código crítico
- ✅ Pre-commit hooks con linting

**Anti-patterns a evitar:**
- ❌ Tests que dependen del orden de ejecución
- ❌ Mocks excesivos que ocultan bugs reales
- ❌ Tests flaky con delays hardcodeados

### 6. PERFORMANCE OPTIMIZATION
**Responsabilidad:** App fluida a 60fps  
**Señales de "Bien Implementado":**
- ✅ FlatList con keyExtractor y getItemLayout
- ✅ Imágenes optimizadas y lazy loaded
- ✅ Memoización donde sea necesaria (useMemo, useCallback)
- ✅ Virtualization para listas largas
- ✅ Bundle size < 50MB
- ✅ Cold start < 3 segundos

**Anti-patterns a evitar:**
- ❌ Re-renders innecesarios
- ❌ Anonymous functions en props
- ❌ Large images sin compresión

### 7. DEVELOPER EXPERIENCE (DX)
**Responsabilidad:** Productividad del equipo  
**Señales de "Bien Implementado":**
- ✅ Hot reload funcionando consistentemente
- ✅ TypeScript strict mode activado
- ✅ Prettier + ESLint configurados
- ✅ Absolute imports configurados
- ✅ Debugger tools funcionando (Flipper/React DevTools)
- ✅ Scripts npm para tareas comunes

**Anti-patterns a evitar:**
- ❌ Configuraciones manuales no documentadas
- ❌ Dependencias con vulnerabilidades
- ❌ Build process > 5 minutos

### 8. UI/UX CONSISTENCY
**Responsabilidad:** Experiencia de usuario coherente  
**Herramienta:** React Native Paper (Material Design 3)  
**Señales de "Bien Implementado":**
- ✅ Theme system consistente
- ✅ Componentes del design system usados
- ✅ Feedback visual para todas las acciones
- ✅ Skeleton screens mientras carga
- ✅ Empty states informativos
- ✅ Error boundaries con fallback UI

**Anti-patterns a evitar:**
- ❌ Estilos inline contradiciendo el theme
- ❌ Componentes custom cuando existe uno en Paper
- ❌ Inconsistencias de spacing/colores

### 9. DATA VALIDATION & FORMS
**Responsabilidad:** Entrada de datos confiable  
**Señales de "Bien Implementado":**
- ✅ Validación client-side inmediata
- ✅ Mensajes de error claros y específicos
- ✅ Keyboard types apropiados (email, numeric, etc.)
- ✅ Auto-capitalize correcto
- ✅ Masks para inputs formateados (teléfono, CI)
- ✅ Scroll automático a campos con error

**Anti-patterns a evitar:**
- ❌ Submit sin validación previa
- ❌ Perder datos al navegar accidentalmente
- ❌ Validación solo en backend

### 10. SECURITY & PRIVACY
**Responsabilidad:** Proteger datos sensibles de pacientes  
**Señales de "Bien Implementado":**
- ✅ HTTPS only para API calls
- ✅ Token storage seguro (Keychain/Keystore)
- ✅ No logs de datos personales
- ✅ Biometric auth opcional
- ✅ Session timeout configurable
- ✅ Certificate pinning (producción)

**Anti-patterns a evitar:**
- ❌ Tokens en código o repos
- ❌ Screenshots con datos sensibles permitidos
- ❌ Cache no limpiado al logout

## 🎓 Matriz de Competencias por Rol

| Skill | Junior | Mid | Senior | Lead |
|-------|--------|-----|--------|------|
| React Native | Básico | Proficient | Expert | Expert |
| TypeScript | Básico | Proficient | Expert | Expert |
| Estado | Básico | Proficient | Proficient | Expert |
| Testing | - | Básico | Proficient | Expert |
| Performance | - | Básico | Proficient | Expert |
| Security | Awareness | Básico | Proficient | Expert |
| Architecture | - | Awareness | Proficient | Expert |
| Mentoring | - | - | Básico | Expert |

## 📈 Plan de Desarrollo de Skills

### Para Juniors (0-1 año)
1. Dominar React Native basics
2. TypeScript fundamentals
3. Debugging tools
4. Git workflow

### Para Mids (1-3 años)
1. State management patterns
2. Testing strategies
3. Performance profiling
4. CI/CD basics

### Para Seniors (3-5 años)
1. Architecture decisions
2. Security best practices
3. Mentoring juniors
4. Code review excellence

### Para Leads (5+ años)
1. Technical debt management
2. Cross-team collaboration
3. Technology selection
4. Team skill development

## 🚀 Recursos de Aprendizaje

### Cursos Recomendados
- [React Native - The Practical Guide](https://www.udemy.com/course/react-native-the-practical-guide/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [Testing React Native Apps](https://www.testim.io/blog/testing-react-native-apps/)

### Documentación Esencial
- [Expo SDK Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [React Native Paper](https://callstack.github.io/react-native-paper/)

### Comunidades
- [Reactiflux Discord](https://www.reactiflux.com/)
- [React Native Community](https://github.com/react-native-community)
- [Expo Forums](https://forums.expo.dev/)

## ✅ Checklist de Onboarding

### Día 1-3: Setup
- [ ] Ambiente de desarrollo configurado
- [ ] Acceso a repos y servicios
- [ ] Primera build exitosa
- [ ] Conocer estructura del proyecto

### Semana 1: Familiarización
- [ ] Completar primera tarea pequeña
- [ ] Entender flujo de autenticación
- [ ] Conocer componentes principales
- [ ] Primera PR aprobada

### Mes 1: Productividad
- [ ] Contribuir a feature completa
- [ ] Escribir primeros tests
- [ ] Participar en code reviews
- [ ] Documentar algo aprendido

### Mes 3: Autonomía
- [ ] Liderar feature pequeña
- [ ] Mentorar a nuevo miembro
- [ ] Proponer mejora técnica
- [ ] Resolver bug complejo

## 🎯 KPIs de Éxito del Equipo

1. **Velocity:** 20+ story points por sprint
2. **Bug Rate:** < 2 bugs críticos por release
3. **Test Coverage:** > 70% en features nuevas
4. **Code Review Time:** < 24 horas
5. **Build Success Rate:** > 95%
6. **User Satisfaction:** > 4.5 estrellas
7. **Crash-free Rate:** > 99.5%
8. **Performance:** < 100ms response time P95
