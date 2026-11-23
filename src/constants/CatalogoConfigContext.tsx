import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from './supabase';

export interface ProductoDB {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
  stockMinimo: number;
  sucursal: string;
  imagenUrl: string;
  activo: boolean;
}

export interface EmpleadoDB {
  id: string;
  nombre: string;
  usuario: string;
  rol: 'Dueño' | 'Encargado' | 'Barbero' | 'Recepción/Caja';
  sucursal: string;
  telefono: string;
  comisionPct: number;
  activo: boolean;
}

export interface SlideHeroDB {
  id: string;
  titulo: string;
  imagenUrl: string;
  orden: number;
}

export interface SeccionImagenDB {
  clave: 'HERO_CLIENTE' | 'PROMO_BANNER' | 'TIENDA_PORTADA' | 'LEALTAD_FONDO';
  tituloSeccion: string;
  descripcion: string;
  imagenUrl: string;
}

interface CatalogoConfigContextType {
  productos: ProductoDB[];
  agregarProducto: (prod: Omit<ProductoDB, 'id'>) => Promise<void>;
  actualizarProducto: (id: string, cambios: Partial<ProductoDB>) => Promise<void>;
  eliminarProducto: (id: string) => Promise<void>;
  vaciarProductos: () => Promise<void>;

  empleados: EmpleadoDB[];
  actualizarEmpleado: (id: string, cambios: Partial<EmpleadoDB>) => Promise<void>;

  slidesHero: SlideHeroDB[];
  agregarSlideHero: (titulo: string, imagenUriOUrl: string) => Promise<void>;
  actualizarSlideHero: (id: string, cambios: Partial<SlideHeroDB>) => Promise<void>;
  eliminarSlideHero: (id: string) => Promise<void>;

  imagenesSecciones: SeccionImagenDB[];
  actualizarImagenSeccion: (clave: SeccionImagenDB['clave'], nuevaUriOUrl: string) => Promise<void>;
  obtenerImagenSeccion: (clave: SeccionImagenDB['clave']) => string;

  imagenesServicios: Record<string, string>;
  actualizarImagenServicio: (claveServicio: string, nuevaUriOUrl: string) => Promise<void>;

  subiendoImagen: boolean;
}

const SLIDES_INICIALES: SlideHeroDB[] = [
  {
    id: 'slide-1',
    titulo: 'Explorar catálogo',
    imagenUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=900',
    orden: 0,
  },
  {
    id: 'slide-2',
    titulo: 'Promociones y estilos',
    imagenUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=900',
    orden: 1,
  },
];

const IMAGENES_FALLBACK: SeccionImagenDB[] = [
  {
    clave: 'TIENDA_PORTADA',
    tituloSeccion: 'App Cliente · Encabezado de Tienda',
    descripcion: 'Imagen de portada en la pestaña Tienda de productos.',
    imagenUrl: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=900',
  },
  {
    clave: 'LEALTAD_FONDO',
    tituloSeccion: 'App Cliente · Banner Comunidad / Lealtad',
    descripcion: 'Imagen visual que aparece antes de las noticias de Instagram.',
    imagenUrl: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=900',
  },
];

const SERVICIOS_IMAGENES_INICIALES: Record<string, string> = {
  'Corte de pelo': 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=900',
  'Arreglo de barba': 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=900',
  'Corte + Barba': 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=900',
  'Afeitado de barba': 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=900',
};

const STORAGE_SLIDES_KEY = 'bz_slides_hero_v1';
const STORAGE_IMGS_KEY = 'bz_config_visual_v1';
const STORAGE_SERVICIOS_KEY = 'bz_imagenes_servicios_v1';

const CatalogoConfigContext = createContext<CatalogoConfigContextType | null>(null);

async function subirArchivoASupabase(uri: string, carpeta: string): Promise<string> {
  if (
    !uri ||
    (!uri.startsWith('file://') &&
      !uri.startsWith('content://') &&
      !uri.startsWith('blob:') &&
      !uri.startsWith('data:'))
  ) {
    return uri;
  }

  try {
    const respuesta = await fetch(uri);
    const arrayBuffer = await respuesta.arrayBuffer();
    const rutaArchivo = `${carpeta}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('app-assets')
      .upload(rutaArchivo, arrayBuffer, { contentType: 'image/jpeg', upsert: true });

    if (uploadError) return uri;

    const { data } = supabase.storage.from('app-assets').getPublicUrl(rutaArchivo);
    return data.publicUrl;
  } catch {
    return uri;
  }
}

export const CatalogoConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [productos, setProductos] = useState<ProductoDB[]>([]);
  const [empleados, setEmpleados] = useState<EmpleadoDB[]>([]);

  const [slidesHero, setSlidesHero] = useState<SlideHeroDB[]>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(STORAGE_SLIDES_KEY);
        if (raw) return JSON.parse(raw);
      }
    } catch {}
    return SLIDES_INICIALES;
  });

  const [imagenesSecciones, setImagenesSecciones] = useState<SeccionImagenDB[]>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(STORAGE_IMGS_KEY);
        if (raw) return JSON.parse(raw);
      }
    } catch {}
    return IMAGENES_FALLBACK;
  });

  const [imagenesServicios, setImagenesServicios] = useState<Record<string, string>>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(STORAGE_SERVICIOS_KEY);
        if (raw) return JSON.parse(raw);
      }
    } catch {}
    return SERVICIOS_IMAGENES_INICIALES;
  });

  const [subiendoImagen, setSubiendoImagen] = useState(false);

  const persistirSlidesLocal = (lista: SlideHeroDB[]) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_SLIDES_KEY, JSON.stringify(lista));
      }
    } catch {}
  };

  const persistirImgsLocal = (lista: SeccionImagenDB[]) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_IMGS_KEY, JSON.stringify(lista));
      }
    } catch {}
  };

  const persistirServiciosLocal = (mapa: Record<string, string>) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_SERVICIOS_KEY, JSON.stringify(mapa));
      }
    } catch {}
  };

  const cargarTodo = async () => {
    const { data: imgs } = await supabase.from('app_imagenes_secciones').select('*');
    if (imgs && imgs.length > 0) {
      const slideConfig = imgs.find((row: any) => row.clave === 'SLIDES_CARRUSEL_JSON');
      if (slideConfig?.imagen_url) {
        try {
          const parsed = JSON.parse(slideConfig.imagen_url);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSlidesHero(parsed);
            persistirSlidesLocal(parsed);
          }
        } catch {}
      }

      const srvConfig = imgs.find((row: any) => row.clave === 'IMAGENES_SERVICIOS_JSON');
      if (srvConfig?.imagen_url) {
        try {
          const parsedSrv = JSON.parse(srvConfig.imagen_url);
          if (parsedSrv && typeof parsedSrv === 'object') {
            setImagenesServicios(parsedSrv);
            persistirServiciosLocal(parsedSrv);
          }
        } catch {}
      }

      setImagenesSecciones((prev) => {
        const next = prev.map((def) => {
          const encontrada = imgs.find((row: any) => row.clave === def.clave);
          return encontrada
            ? {
                ...def,
                imagenUrl: encontrada.imagen_url || def.imagenUrl,
              }
            : def;
        });
        persistirImgsLocal(next);
        return next;
      });
    }

    const { data: prods } = await supabase
      .from('productos')
      .select('*')
      .order('created_at', { ascending: false });

    if (prods) {
      setProductos(
        prods.map((p: any) => ({
          id: String(p.id),
          nombre: p.nombre,
          categoria: p.categoria ?? 'General',
          precio: Number(p.precio ?? 0),
          stock: Number(p.stock ?? 0),
          stockMinimo: Number(p.stock_minimo ?? 5),
          sucursal: p.sucursal ?? 'Olivete',
          imagenUrl:
            p.imagen_url ??
            'https://images.unsplash.com/photo-1626808642875-0aa545482dfb?w=600',
          activo: p.activo ?? true,
        })),
      );
    }

    const { data: emps } = await supabase
      .from('empleados')
      .select('*')
      .order('created_at', { ascending: true });

    if (emps) {
      setEmpleados(
        emps.map((e: any) => ({
          id: String(e.id),
          nombre: e.nombre,
          usuario: e.usuario,
          rol: e.rol,
          sucursal: e.sucursal,
          telefono: e.telefono ?? '',
          comisionPct: Number(e.comision_pct ?? 45),
          activo: e.activo ?? true,
        })),
      );
    }
  };

  useEffect(() => {
    cargarTodo();

    const canal = supabase
      .channel('sincronizacion-catalogo-app')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_imagenes_secciones' },
        () => cargarTodo(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'productos' },
        () => cargarTodo(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  const sincronizarSlidesEnSupabase = async (nuevaLista: SlideHeroDB[]) => {
    persistirSlidesLocal(nuevaLista);
    await supabase.from('app_imagenes_secciones').upsert({
      clave: 'SLIDES_CARRUSEL_JSON',
      titulo_seccion: 'Slides del Carrusel Principal',
      descripcion: 'JSON con los apartados de la animación principal',
      imagen_url: JSON.stringify(nuevaLista),
      updated_at: new Date().toISOString(),
    });
  };

  const agregarSlideHero = async (titulo: string, imagenUriOUrl: string) => {
    setSubiendoImagen(true);
    try {
      const urlPublica = await subirArchivoASupabase(
        imagenUriOUrl.trim() ||
          'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=900',
        'slides',
      );
      const nuevo: SlideHeroDB = {
        id: `slide-${Date.now()}`,
        titulo: titulo.trim() || `Apartado ${slidesHero.length + 1}`,
        imagenUrl: urlPublica,
        orden: slidesHero.length,
      };
      const actualizada = [...slidesHero, nuevo];
      setSlidesHero(actualizada);
      await sincronizarSlidesEnSupabase(actualizada);
    } finally {
      setSubiendoImagen(false);
    }
  };

  const actualizarSlideHero = async (id: string, cambios: Partial<SlideHeroDB>) => {
    setSubiendoImagen(true);
    try {
      let urlFinal = cambios.imagenUrl;
      if (urlFinal) {
        urlFinal = await subirArchivoASupabase(urlFinal.trim(), 'slides');
      }
      const actualizada = slidesHero.map((s) =>
        s.id === id
          ? { ...s, ...cambios, ...(urlFinal ? { imagenUrl: urlFinal } : {}) }
          : s,
      );
      setSlidesHero(actualizada);
      await sincronizarSlidesEnSupabase(actualizada);
    } finally {
      setSubiendoImagen(false);
    }
  };

  const eliminarSlideHero = async (id: string) => {
    const actualizada = slidesHero.filter((s) => s.id !== id);
    setSlidesHero(actualizada);
    await sincronizarSlidesEnSupabase(actualizada);
  };

  const agregarProducto = async (prod: Omit<ProductoDB, 'id'>) => {
    setSubiendoImagen(true);
    const tempId = `temp-${Date.now()}`;
    setProductos((prev) => [{ ...prod, id: tempId }, ...prev]);

    try {
      const urlFinal = await subirArchivoASupabase(prod.imagenUrl, 'productos');
      const { data, error } = await supabase
        .from('productos')
        .insert({
          nombre: prod.nombre,
          categoria: prod.categoria,
          precio: prod.precio,
          stock: prod.stock,
          stock_minimo: prod.stockMinimo,
          sucursal: prod.sucursal,
          imagen_url: urlFinal,
          activo: prod.activo,
        })
        .select()
        .single();

      if (error) {
        Alert.alert(
          'Aviso de Base de Datos',
          `Se mostró localmente, pero Supabase respondió: ${error.message}`,
        );
        return;
      }

      if (data) {
        setProductos((prev) =>
          prev.map((item) =>
            item.id === tempId
              ? {
                  id: String(data.id),
                  nombre: data.nombre,
                  categoria: data.categoria,
                  precio: Number(data.precio),
                  stock: Number(data.stock),
                  stockMinimo: Number(data.stock_minimo),
                  sucursal: data.sucursal,
                  imagenUrl: data.imagen_url,
                  activo: data.activo,
                }
              : item,
          ),
        );
      }
    } finally {
      setSubiendoImagen(false);
    }
  };

  const actualizarProducto = async (id: string, cambios: Partial<ProductoDB>) => {
    setProductos((prev) => prev.map((p) => (p.id === id ? { ...p, ...cambios } : p)));
    if (id.startsWith('temp-')) return;
    await supabase
      .from('productos')
      .update({
        ...(cambios.nombre !== undefined ? { nombre: cambios.nombre } : {}),
        ...(cambios.precio !== undefined ? { precio: cambios.precio } : {}),
        ...(cambios.stock !== undefined ? { stock: cambios.stock } : {}),
        ...(cambios.activo !== undefined ? { activo: cambios.activo } : {}),
      })
      .eq('id', id);
  };

  const eliminarProducto = async (id: string) => {
    setProductos((prev) => prev.filter((p) => p.id !== id));
    if (id.startsWith('temp-')) return;
    await supabase.from('productos').delete().eq('id', id);
  };

  const vaciarProductos = async () => {
    setProductos([]);
    await supabase.from('productos').delete().not('id', 'is', null);
  };

  const actualizarEmpleado = async (id: string, cambios: Partial<EmpleadoDB>) => {
    setEmpleados((prev) => prev.map((e) => (e.id === id ? { ...e, ...cambios } : e)));
    await supabase
      .from('empleados')
      .update({
        ...(cambios.activo !== undefined ? { activo: cambios.activo } : {}),
        ...(cambios.comisionPct !== undefined
          ? { comision_pct: cambios.comisionPct }
          : {}),
      })
      .eq('id', id);
  };

  const actualizarImagenSeccion = async (
    clave: SeccionImagenDB['clave'],
    nuevaUriOUrl: string,
  ) => {
    setSubiendoImagen(true);
    try {
      const urlPublica = await subirArchivoASupabase(nuevaUriOUrl.trim(), 'secciones');
      const seccionActual = imagenesSecciones.find((s) => s.clave === clave);

      setImagenesSecciones((prev) => {
        const next = prev.map((img) =>
          img.clave === clave ? { ...img, imagenUrl: urlPublica } : img,
        );
        persistirImgsLocal(next);
        return next;
      });

      await supabase.from('app_imagenes_secciones').upsert({
        clave,
        titulo_seccion: seccionActual?.tituloSeccion ?? clave,
        descripcion: seccionActual?.descripcion ?? '',
        imagen_url: urlPublica,
        updated_at: new Date().toISOString(),
      });
    } finally {
      setSubiendoImagen(false);
    }
  };

  const obtenerImagenSeccion = (clave: SeccionImagenDB['clave']) => {
    return imagenesSecciones.find((i) => i.clave === clave)?.imagenUrl ?? '';
  };

  const actualizarImagenServicio = async (
    claveServicio: string,
    nuevaUriOUrl: string,
  ) => {
    setSubiendoImagen(true);
    try {
      const urlPublica = await subirArchivoASupabase(nuevaUriOUrl.trim(), 'servicios');
      const actualizado = { ...imagenesServicios, [claveServicio]: urlPublica };
      setImagenesServicios(actualizado);
      persistirServiciosLocal(actualizado);

      await supabase.from('app_imagenes_secciones').upsert({
        clave: 'IMAGENES_SERVICIOS_JSON',
        titulo_seccion: 'Imágenes de Servicios Agendar',
        descripcion: 'JSON con fotos de fondo de las tarjetas de servicios',
        imagen_url: JSON.stringify(actualizado),
        updated_at: new Date().toISOString(),
      });
    } finally {
      setSubiendoImagen(false);
    }
  };

  return (
    <CatalogoConfigContext.Provider
      value={{
        productos,
        agregarProducto,
        actualizarProducto,
        eliminarProducto,
        vaciarProductos,
        empleados,
        actualizarEmpleado,
        slidesHero,
        agregarSlideHero,
        actualizarSlideHero,
        eliminarSlideHero,
        imagenesSecciones,
        actualizarImagenSeccion,
        obtenerImagenSeccion,
        imagenesServicios,
        actualizarImagenServicio,
        subiendoImagen,
      }}
    >
      {children}
    </CatalogoConfigContext.Provider>
  );
};

export const useCatalogoConfig = () => {
  const ctx = useContext(CatalogoConfigContext);
  if (!ctx) throw new Error('useCatalogoConfig debe usarse dentro de CatalogoConfigProvider');
  return ctx;
};