'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/navbar';
import { Haul } from '@/types';

export default function HaulsPage() {
  const { data: session, status } = useSession();
  const [hauls, setHauls] = useState<Haul[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (session) {
      fetchHauls();
    }
  }, [session, status, router]);

  const fetchHauls = async () => {
    try {
      const response = await fetch('/api/hauls');
      if (response.ok) {
        const data = await response.json();
        setHauls(data);
      }
    } catch (error) {
      console.error('Error fetching hauls:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteHaul = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este haul?')) {
      return;
    }

    try {
      const response = await fetch(`/api/hauls/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setHauls(hauls.filter(haul => haul._id !== id));
      }
    } catch (error) {
      console.error('Error deleting haul:', error);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Mis Hauls</h1>
            <Link href="/">
              <Button>Nuevo Haul</Button>
            </Link>
          </div>

          {hauls.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No tienes hauls guardados
              </h3>
              <p className="text-gray-500 mb-4">
                Crea tu primer haul para comenzar a calcular costos de importación.
              </p>
              <Link href="/">
                <Button>Crear Primer Haul</Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {hauls.map((haul) => (
                <div key={haul._id} className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {haul.name}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>Productos: {haul.products.length}</p>
                    <p>Peso total: {(haul.totalWeight * 1000).toFixed(0)} grs</p>
                    <p>Costo total: ${haul.totalCost.toFixed(2)} ARS</p>
                    <p>
                      Creado: {new Date(haul.createdAt).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <Link href={`/hauls/${haul._id}/edit`}>
                      <Button variant="outline" size="sm">
                        Editar
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteHaul(haul._id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
