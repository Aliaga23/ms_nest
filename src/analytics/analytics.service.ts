import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';

interface Usuario {
    id: string;
    nombre: string;
    email: string;
    telefono: string;
    estado: boolean;
    es_admin: boolean;
}

interface UsuarioApiResponse {
    success: boolean;
    message: string;
    data: Usuario[];
}

@Injectable()
export class AnalyticsService {
    private readonly logger = new Logger(AnalyticsService.name);
    private readonly usuarioApiUrl: string;

    private readonly categorias = {
        "rendimiento": [
            "precision", "velocidad", "ciclo", "cpm", "eficiencia", "estabilidad",
            "disponibilidad", "consumo", "productividad", "p80", "fragmentacion", "finos",
            "recuperacion", "caudal", "presion", "disponibilidad_flota"
        ],
        "calidad_conformidad": [
            "consistencia", "tolerancia", "conformidad", "presentacion", "defectos",
            "control_calidad", "satisfaccion", "pureza", "granulometria", "humedad",
            "pilling", "resistencia", "uniformidad_color", "solidez", "delta_e", "color",
            "area_util", "grosor", "impurezas", "choque_termico", "dimension_cuello",
            "burbujas", "cordones", "compatibilidad_linea", "top_load", "ensayo_caida",
            "medidas_exactas"
        ],
        "calidad_sensorial_producto": [
            "sabor", "textura", "frescura", "aroma", "olor", "temperatura",
            "crocancia"
        ],
        "seguridad_cumplimiento": [
            "seguridad", "riesgo", "incidente", "parada_emergencia", "resguardo", "norma",
            "certificacion", "inspeccion", "documentacion", "trazabilidad", "hse", "talud",
            "geomecanica", "vibracion", "polvo", "hepa", "epp", "loto", "norma_ambiental",
            "efluentes", "cp", "corrosion", "pigging", "odorizacion", "valvula_alivio",
            "hazop", "planes_cierre"
        ],
        "operaciones_mantenimiento": [
            "configuracion", "ajuste", "parametro", "mantenimiento", "diagnostico",
            "telemetria", "monitoreo", "alerta", "evento", "reporte", "panel", "kpi",
            "metrica", "umbral", "tendencia", "registro", "historico", "scada", "muestreo",
            "reconciliacion", "soporte_inicial", "mantenimiento_anual", "repuestos_basicos",
            "ruido_vibracion", "estado_reparacion", "garantia_servicio",
            "avisos_estado_servicio"
        ],
        "logistica_entregas": [
            "transporte", "ruta", "entrega", "inventario", "programacion", "tracking",
            "ultima_milla", "tiempos_espera", "cadena_frio", "zona_franca", "consolidacion",
            "ventanas_entrega", "clima", "lluvias", "tracking_flota", "mermas", "roturas",
            "otif", "empaque_vidrio", "cantonera", "bolsas_antihumedad",
            "empaques_protectores", "franja_horaria", "retiro_en_tienda",
            "seguimiento_pedido_app"
        ],
        "experiencia_cliente_soporte": [
            "comunicacion", "facilidad", "puntualidad", "soporte", "posventa",
            "capacitacion", "recomendacion", "satisfaccion_usuario",
            "documentacion_tecnica", "informes", "post_servicio", "bilingue",
            "metodos_pago", "senalizacion", "atencion_tienda", "showroom",
            "rapidez_carga", "limpieza_estacion", "senalizacion_precios",
            "servicios_extras", "tienda_conveniencia"
        ],
        "comercial_precio_canales": [
            "precio_percepcion", "promociones", "combos", "suscripcion", "canales_compra",
            "tipo_cambio", "metodos_pago_adicionales", "alcance", "interaccion", "kpi_pauta"
        ],
        "sostenibilidad_impacto": [
            "reportes_periodicidad", "indicadores_kg_co2_arboles", "certificados_impacto",
            "incentivos_reciclaje", "captacion_lluvia", "eficiencia_hidrica", "mulching",
            "energia_residencial_ahorro", "app_monitorizacion", "soporte_postinstalacion",
            "gestion_colas", "monitoreo_aguas", "frecuencia_monitoreo",
            "parametros_ambientales", "incidentes_ambientales", "comunicacion_comunidades"
        ],
        "agro_alimentos": [
            "plan_siembra", "poblacion_objetivo", "uniformidad_emergencia",
            "ajustes_maquinaria", "malezas_plagas", "fertirriego",
            "sensores_humedad_suelo", "sectorizacion_suelos", "laminas_riego",
            "calidad_agua_ce_ph", "credito_campana", "coberturas_precios", "canje_insumos",
            "riesgo_clima_mercado", "trichoderma", "bacillus_subtilis", "beauveria_bassiana",
            "ph_aplicacion", "coadyuvantes", "compatibilidades", "inoculacion",
            "colonizacion_radicular", "absorcion_fosforo", "resistencia_estres",
            "calendario_refuerzos", "condiciones_suelo_ph", "hmf", "diastasa",
            "cristalizacion_miel", "filtrado_miel", "manejo_termico_miel",
            "analisis_polínico", "mapeo_floraciones", "perfil_sensorial", "rotulado_lotes",
            "porcentaje_cacao", "perfiles_aroma", "combinaciones_locales",
            "presentacion_regalo"
        ],
        "servicios_profesionales_creativos": [
            "relevamiento_inicial", "alcance", "prototipo_mockup_demo",
            "canal_seguimiento", "demos_frecuentes", "respuestas_rapidas",
            "tablero_tareas", "ritmo_entregas", "estabilidad_app", "pruebas_basicas",
            "fecha_objetivo", "manuales_videos", "produccion_orden",
            "puntualidad_entregas", "flexibilidad_cambios", "kpi_proyecto"
        ],
        "utilidades_y_domesticos": [
            "facilidad_uso", "altura_comoda", "agua_fria_caliente",
            "derrames_cambio_garrafon", "accesorios_dispensa", "mantenimiento_programado",
            "pruebas_hermeticidad", "capacitacion_usuarios", "revision_valvulas",
            "incidentes_gas", "inspecciones_periodicas", "calibracion_medidores",
            "lectura_fotografica", "alertas_consumo", "claridad_factura",
            "lectura_remota_ami"
        ],
        "industrial_especifica": [
            "vidrio_roller_waves", "vidrio_sulfuro_niquel", "vidrio_anisotropia_optica",
            "vidrio_proteccion_bordes", "vidrio_canto_pulido", "vidrio_curvado",
            "vidrio_serigrafia", "vidrio_peso_unidad", "vidrio_paletizado",
            "vidrio_separadores_antiabrasion",
            "oro_cianuracion", "oro_ph_orp", "oro_tiempo_residencia",
            "oro_consumo_nacn", "oro_carbon_activado", "oro_adr",
            "oro_detox_so2_aire", "oro_detox_peroxido", "oro_colas_mineras",
            "minas_gestion_colas", "minas_muestreo", "minas_geometalurgia",
            "madera_poaf", "madera_trazabilidad_gps", "madera_relacion_comunidades",
            "madera_especies_volumenes", "madera_rendimiento_trozas",
            "madera_patron_corte", "madera_afilado_mantenimiento", "madera_seleccion_diametro",
            "madera_rendimiento_aserrio", "madera_clasificacion_estandarizacion",
            "madera_curvas_secado", "madera_sellado_extremos", "madera_apilado_espaciadores",
            "madera_contenido_humedad", "madera_acabado_en_uso"
        ]
    };

    constructor(
        private readonly prisma: PrismaService,
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        this.usuarioApiUrl = this.configService.get<string>('USUARIO_SERVICE_URL') || '';
        if (!this.usuarioApiUrl) {
            throw new Error('USUARIO_SERVICE_URL no está configurada en las variables de entorno');
        }
    }

    async getKmeansData() {
        try {
            this.logger.log('Iniciando recolección de datos para K-means...');

            const usuarios = await this.getAllUsuarios();
            this.logger.log(`Usuarios obtenidos: ${usuarios.length}`);

            const usuariosConDatos = await this.getDatosEncuestasPorUsuarios(usuarios);

            const usuariosLimpios = this.filtrarPreguntasCompletar(usuariosConDatos);

            const resultado = usuariosLimpios.map(usuario => {
                try {
                    return {
                        informacion_usuario: {
                            usuario_id: usuario.usuario_id || '',
                            nombre: usuario.nombre || '',
                            email: usuario.email || '',
                            telefono: usuario.telefono || '',
                            estado: Boolean(usuario.estado),
                            es_admin: Boolean(usuario.es_admin)
                        },
                        datos_encuestas: (usuario.encuestas || []).map(encuesta => {
                            try {
                                return {
                                    encuesta: {
                                        id: encuesta.encuesta_id || '',
                                        nombre: encuesta.encuesta_nombre || '',
                                        descripcion: encuesta.encuesta_descripcion || '',
                                        campana: encuesta.campana_nombre || 'Sin campaña',
                                        canal: encuesta.canal || 'Sin canal',
                                        activo: Boolean(encuesta.activo)
                                    },
                                    estructura_preguntas: (encuesta.preguntas || []).map(pregunta => ({
                                        pregunta_texto: pregunta.pregunta_texto || '',
                                        tipo_pregunta: pregunta.tipo_pregunta || '',
                                        pregunta_obligatoria: Boolean(pregunta.pregunta_obligatoria),
                                        pregunta_orden: parseInt(pregunta.pregunta_orden) || 0,
                                        opciones_disponibles: (pregunta.opciones_disponibles || []).map(opcion => ({
                                            texto: opcion.texto || '',
                                            valor: opcion.valor || ''
                                        }))
                                    })),
                                    respuestas_usuario: (encuesta.respuestas || []).map(respuesta => ({
                                        entrega_id: respuesta.entrega_id || '',
                                        pregunta_texto: respuesta.pregunta_texto || '',
                                        tipo_pregunta: respuesta.tipo_pregunta || '',
                                        pregunta_orden: parseInt(respuesta.pregunta_orden) || 0,
                                        opciones_disponibles: (respuesta.opciones_disponibles || []).map(opcion => ({
                                            texto: opcion.texto || '',
                                            valor: opcion.valor || ''
                                        })),
                                        respuesta_seleccionada: respuesta.respuesta_seleccionada || null,
                                        valores_seleccionados: respuesta.valores_seleccionados || [],
                                        respuesta_texto_libre: respuesta.respuesta_texto_libre || null,
                                        fecha_respuesta: respuesta.fecha_respuesta || null
                                    }))
                                };
                            } catch (encuestaError) {
                                this.logger.error(`Error procesando encuesddta: ${encuestaError.message}`);
                                return null;
                            }
                        }).filter(encuesta => encuesta !== null)
                    };
                } catch (usuarioError) {
                    this.logger.error(`Error procesando usuario: ${usuarioError.message}`);
                    return null;
                }
            }).filter(usuario => usuario !== null);

            this.logger.log(`Datos procesados exitosamente. Total usuarios con datos: ${usuariosLimpios.length}`);
            return resultado;

        } catch (error) {
            this.logger.error('Error al obtener datos para K-means:', error);
            throw new Error(`Error al procesar datos: ${error.message}`);
        }
    }

    private async getAllUsuarios(): Promise<Usuario[]> {
        try {
            const usuarios: Usuario[] = [];
            let page = 1;
            let hasMore = true;

            while (hasMore) {
                const url = `${this.usuarioApiUrl}/usuarios?page=${page}&limit=100`;
                this.logger.log(`Obteniendo usuarios página ${page}...`);

                const response = await lastValueFrom(
                    this.httpService.get<UsuarioApiResponse>(url, {
                        headers: { 'accept': 'application/json' }
                    })
                );

                if (response.data.success && response.data.data.length > 0) {
                    usuarios.push(...response.data.data);
                    page++;
                    
                    if (response.data.data.length < 100) {
                        hasMore = false;
                    }
                } else {
                    hasMore = false;
                }
            }

            return usuarios;
        } catch (error) {
            this.logger.error('Error al obtener usuarios del microservicio:', error);
            throw new Error('No se pudieron obtener los usuarios del servicio externo');
        }
    }

    private async getDatosEncuestasPorUsuarios(usuarios: Usuario[]) {
        const usuariosConDatos: any[] = [];

        for (const usuario of usuarios) {
            try {
                const encuestas = await this.prisma.encuesta.findMany({
                    where: { user_id: usuario.id },
                    include: {
                        campaña: true,
                        canal: true,
                        preguntas: {
                            include: {
                                tipo_pregunta: true,
                                opciones: true
                            }
                        },
                        entregas: {
                            include: {
                                respuestas: {
                                    include: {
                                        pregunta: {
                                            include: {
                                                tipo_pregunta: true,
                                                opciones: true
                                            }
                                        },
                                        opcion_encuesta: true
                                    }
                                }
                            }
                        }
                    }
                });

                if (encuestas.length > 0) {
                    const encuestasConRespuestas = encuestas.map(encuesta => ({
                        encuesta_id: encuesta.id,
                        encuesta_nombre: encuesta.nombre,
                        encuesta_descripcion: encuesta.descripcion,
                        campana_nombre: encuesta.campaña?.nombre || 'Sin campaña',
                        canal: encuesta.canal?.nombre || 'Sin canal',
                        activo: encuesta.activo,
                        preguntas: encuesta.preguntas.map(pregunta => ({
                            pregunta_texto: pregunta.texto,
                            tipo_pregunta: pregunta.tipo_pregunta.nombre,
                            pregunta_obligatoria: pregunta.obligatorio,
                            pregunta_orden: pregunta.orden,
                            opciones_disponibles: pregunta.opciones.map(opcion => ({
                                texto: opcion.texto,
                                valor: opcion.valor
                            }))
                        })),
                        respuestas: this.agruparRespuestasPorPregunta(encuesta.entregas)
                    }));

                    usuariosConDatos.push({
                        usuario_id: usuario.id,
                        nombre: usuario.nombre,
                        email: usuario.email,
                        telefono: usuario.telefono,
                        estado: usuario.estado,
                        es_admin: usuario.es_admin,
                        encuestas: encuestasConRespuestas
                    });
                }
            } catch (error) {
                this.logger.warn(`Error procesando usuario ${usuario.id}: ${error.message}`);
            }
        }

        return usuariosConDatos;
    }

    private agruparRespuestasPorPregunta(entregas: any[]) {
        const respuestasAgrupadas = new Map();

        entregas.forEach(entrega => {
            entrega.respuestas.forEach(respuesta => {
                const key = `${entrega.id}_${respuesta.pregunta.orden}_${respuesta.preguntaId}`;
                
                if (!respuestasAgrupadas.has(key)) {
                    respuestasAgrupadas.set(key, {
                        entrega_id: entrega.id,
                        pregunta_id: respuesta.preguntaId,
                        pregunta_texto: respuesta.pregunta.texto,
                        tipo_pregunta: respuesta.pregunta.tipo_pregunta.nombre,
                        pregunta_obligatoria: respuesta.pregunta.obligatorio,
                        pregunta_orden: respuesta.pregunta.orden,
                        opciones_disponibles: respuesta.pregunta.opciones.map(opcion => ({
                            texto: opcion.texto,
                            valor: opcion.valor
                        })),
                        respuestas_seleccionadas: [],
                        respuesta_texto_libre: null,
                        fecha_respuesta: null
                    });
                }

                const item = respuestasAgrupadas.get(key);
                
                if (respuesta.opcion_encuesta) {
                    item.respuestas_seleccionadas.push({
                        valor: respuesta.opcion_encuesta.valor,
                        texto: respuesta.opcion_encuesta.texto
                    });
                }

                if (respuesta.texto) {
                    item.respuesta_texto_libre = respuesta.texto;
                }

                if (respuesta.recibido_en) {
                    item.fecha_respuesta = respuesta.recibido_en;
                }
            });
        });

        return Array.from(respuestasAgrupadas.values()).map(respuesta => {
            const respuestasUnicas = respuesta.respuestas_seleccionadas.filter((item, index, self) =>
                index === self.findIndex(t => t.valor === item.valor)
            );

            return {
                entrega_id: respuesta.entrega_id,
                pregunta_id: respuesta.pregunta_id,
                pregunta_texto: respuesta.pregunta_texto,
                tipo_pregunta: respuesta.tipo_pregunta,
                pregunta_obligatoria: respuesta.pregunta_obligatoria,
                pregunta_orden: respuesta.pregunta_orden,
                opciones_disponibles: respuesta.opciones_disponibles,
                respuesta_seleccionada: respuestasUnicas.length > 0 ? 
                    (respuesta.tipo_pregunta === 'Opción Múltiple' ? 
                        respuestasUnicas.map(r => r.texto).join(', ') :
                        respuestasUnicas[0].texto
                    ) : null,
                valores_seleccionados: respuestasUnicas.map(r => r.valor),
                respuesta_texto_libre: respuesta.respuesta_texto_libre,
                fecha_respuesta: respuesta.fecha_respuesta
            };
        });
    }

    private filtrarPreguntasCompletar(usuariosConDatos: any[]) {
        return usuariosConDatos.map(usuario => ({
            ...usuario,
            encuestas: usuario.encuestas.map(encuesta => ({
                ...encuesta,
                preguntas: encuesta.preguntas.filter(pregunta => 
                    pregunta.tipo_pregunta !== 'Completar'
                ),
                respuestas: encuesta.respuestas.filter(respuesta => 
                    respuesta.tipo_pregunta !== 'Completar'
                )
            })).filter(encuesta => 
                encuesta.respuestas.length > 0 || encuesta.preguntas.length > 0
            )
        })).filter(usuario => usuario.encuestas.length > 0);
    }

    async getUsuariosList() {
        try {
            this.logger.log('Obteniendo lista de usuarios...');

            const usuarios = await this.getAllUsuarios();

            const usuariosConResumen: any[] = [];

            for (const usuario of usuarios) {
                try {
                    const encuestas = await this.prisma.encuesta.findMany({
                        where: { user_id: usuario.id },
                        include: {
                            preguntas: {
                                include: {
                                    tipo_pregunta: true,
                                    opciones: true
                                }
                            },
                            entregas: {
                                include: {
                                    respuestas: {
                                        include: {
                                            pregunta: {
                                                include: {
                                                    tipo_pregunta: true,
                                                    opciones: true
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    });

                    if (encuestas.length > 0) {
                        const totalRespuestas = encuestas.reduce((sum, encuesta) =>
                            sum + encuesta.entregas.reduce((entSum, entrega) =>
                                entSum + entrega.respuestas.filter(resp => 
                                    resp.pregunta.tipo_pregunta.nombre !== 'Completar'
                                ).length, 0
                            ), 0
                        );

                        if (totalRespuestas > 0) {
                            usuariosConResumen.push({
                                usuario_id: usuario.id,
                                nombre: usuario.nombre,
                                email: usuario.email,
                                estado: usuario.estado,
                                total_encuestas: encuestas.length,
                                total_respuestas: totalRespuestas
                            });
                        }
                    }
                } catch (error) {
                    this.logger.warn(`Error procesando resumen de usuario ${usuario.id}: ${error.message}`);
                }
            }

            this.logger.log(`Lista de usuarios procesada: ${usuariosConResumen.length} usuarios con datos`);
            
            return usuariosConResumen.map(usuario => ({
                usuario_id: usuario.usuario_id,
                nombre: usuario.nombre,
                email: usuario.email,
                estado: usuario.estado,
                resumen_datos: {
                    total_encuestas: usuario.total_encuestas,
                    total_respuestas: usuario.total_respuestas,
                    tiene_datos_para_analisis: usuario.total_respuestas > 0
                }
            }));

        } catch (error) {
            this.logger.error('Error al obtener lista de usuarios:', error);
            throw new Error(`Error al procesar lista de usuarios: ${error.message}`);
        }
    }

    async getUsuarioKmeansData(userId: string) {
        try {
            this.logger.log(`Obteniendo datos K-means para usuario: ${userId}`);

            const usuarioInfo = await this.getUsuarioById(userId);
            if (!usuarioInfo) {
                return null;
            }

            const datosUsuario = await this.getDatosEncuestasPorUsuarios([usuarioInfo]);
            
            if (datosUsuario.length === 0) {
                return null;
            }

            const usuarioLimpio = this.filtrarPreguntasCompletar(datosUsuario)[0];
            
            if (!usuarioLimpio || usuarioLimpio.encuestas.length === 0) {
                return null;
            }

            const resultado = (usuarioLimpio.encuestas || []).map(encuesta => {
                try {
                    return {
                        encuesta: {
                            id: encuesta.encuesta_id || '',
                            nombre: encuesta.encuesta_nombre || '',
                            descripcion: encuesta.encuesta_descripcion || '',
                            campana: encuesta.campana_nombre || 'Sin campaña',
                            canal: encuesta.canal || 'Sin canal',
                            activo: Boolean(encuesta.activo)
                        },
                        estructura_preguntas: (encuesta.preguntas || []).map(pregunta => ({
                            pregunta_texto: pregunta.pregunta_texto || '',
                            tipo_pregunta: pregunta.tipo_pregunta || '',
                            pregunta_obligatoria: Boolean(pregunta.pregunta_obligatoria),
                            pregunta_orden: parseInt(pregunta.pregunta_orden) || 0,
                            opciones_disponibles: (pregunta.opciones_disponibles || []).map(opcion => ({
                                texto: opcion.texto || '',
                                valor: opcion.valor || ''
                            }))
                        })),
                        respuestas_usuario: (encuesta.respuestas || []).map(respuesta => ({
                            entrega_id: respuesta.entrega_id || '',
                            pregunta_texto: respuesta.pregunta_texto || '',
                            tipo_pregunta: respuesta.tipo_pregunta || '',
                            pregunta_orden: parseInt(respuesta.pregunta_orden) || 0,
                            opciones_disponibles: (respuesta.opciones_disponibles || []).map(opcion => ({
                                texto: opcion.texto || '',
                                valor: opcion.valor || ''
                            })),
                            respuesta_seleccionada: respuesta.respuesta_seleccionada || null,
                            valores_seleccionados: respuesta.valores_seleccionados || [],
                            respuesta_texto_libre: respuesta.respuesta_texto_libre || null,
                            fecha_respuesta: respuesta.fecha_respuesta || null
                        }))
                    };
                } catch (encuestaError) {
                    this.logger.error(`Error procesando encuesta: ${encuestaError.message}`);
                    return null;
                }
            }).filter(encuesta => encuesta !== null);

            this.logger.log(`Datos K-means obtenidos para usuario ${userId}`);
            return resultado;

        } catch (error) {
            this.logger.error(`Error al obtener datos K-means para usuario ${userId}:`, error);
            throw new Error(`Error al procesar datos del usuario: ${error.message}`);
        }
    }

    private async getUsuarioById(userId: string): Promise<Usuario | null> {
        try {
            let page = 1;
            let hasMore = true;

            while (hasMore) {
                const url = `${this.usuarioApiUrl}/usuarios?page=${page}&limit=100`;
                
                const response = await lastValueFrom(
                    this.httpService.get<UsuarioApiResponse>(url, {
                        headers: { 'accept': 'application/json' }
                    })
                );

                if (response.data.success && response.data.data.length > 0) {
                    const usuario = response.data.data.find(u => u.id === userId);
                    if (usuario) {
                        return usuario;
                    }
                    
                    page++;
                    if (response.data.data.length < 100) {
                        hasMore = false;
                    }
                } else {
                    hasMore = false;
                }
            }

            return null;
        } catch (error) {
            this.logger.error(`Error al buscar usuario ${userId}:`, error);
            return null;
        }
    }

    private calcularEstadisticas(usuariosLimpios: any[]) {
        const totalUsuarios = usuariosLimpios.length;
        const totalEncuestas = usuariosLimpios.reduce((sum, usuario) => sum + usuario.encuestas.length, 0);
        const totalRespuestas = usuariosLimpios.reduce((sum, usuario) => 
            sum + usuario.encuestas.reduce((encSum, encuesta) => encSum + encuesta.respuestas.length, 0), 0
        );

        const tiposPregunta = new Set();
        usuariosLimpios.forEach(usuario => {
            usuario.encuestas.forEach(encuesta => {
                encuesta.respuestas.forEach(respuesta => {
                    tiposPregunta.add(respuesta.tipo_pregunta);
                });
            });
        });

        return {
            total_usuarios: totalUsuarios,
            total_encuestas: totalEncuestas,
            total_respuestas: totalRespuestas,
            tipos_pregunta_incluidos: Array.from(tiposPregunta),
            usuarios_con_respuestas: usuariosLimpios.filter(u => 
                u.encuestas.some(e => e.respuestas.length > 0)
            ).length
        };
    }

    private calcularEstadisticasUsuario(usuario: any) {
        const totalEncuestas = usuario.encuestas.length;
        const totalRespuestas = usuario.encuestas.reduce((sum, encuesta) => sum + encuesta.respuestas.length, 0);

        const tiposPregunta = new Set();
        const canales = new Set();
        const campanas = new Set();

        usuario.encuestas.forEach(encuesta => {
            canales.add(encuesta.canal);
            campanas.add(encuesta.campana_nombre);
            encuesta.respuestas.forEach(respuesta => {
                tiposPregunta.add(respuesta.tipo_pregunta);
            });
        });

        return {
            total_encuestas: totalEncuestas,
            total_respuestas: totalRespuestas,
            tipos_pregunta_incluidos: Array.from(tiposPregunta),
            canales_utilizados: Array.from(canales),
            campanas_participadas: Array.from(campanas),
            tiene_respuestas: totalRespuestas > 0
        };
    }
}