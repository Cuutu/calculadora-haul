'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/navbar';
import { Haul } from '@/types';

export default function ProfilePage() {
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
          {/* Header del perfil */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  ¡Hola, {session.user?.name}! 👋
                </h1>
                <p className="text-gray-600 mt-1">
                  @{session.user?.username}
                </p>
              </div>
              <div className="flex space-x-3">
                <Link href="/">
                  <Button>Nuevo Haul</Button>
                </Link>
                <Link href="/hauls">
                  <Button variant="outline">Ver Todos</Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900">Total Hauls</h3>
              <p className="text-3xl font-bold text-blue-600">{hauls.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900">Productos Totales</h3>
              <p className="text-3xl font-bold text-green-600">
                {hauls.reduce((sum, haul) => sum + haul.products.length, 0)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900">Peso Total</h3>
              <p className="text-3xl font-bold text-purple-600">
                {hauls.reduce((sum, haul) => sum + haul.totalWeight, 0).toFixed(1)} kg
              </p>
            </div>
          </div>

          {/* Hauls recientes */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Hauls Recientes</h2>
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
              <div className="divide-y divide-gray-200">
                {hauls.slice(0, 5).map((haul) => (
                  <div key={haul._id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {haul.name}
                        </h3>
                        <div className="mt-2 flex space-x-6 text-sm text-gray-600">
                          <span>Productos: {haul.products.length}</span>
                          <span>Peso: {haul.totalWeight.toFixed(2)} kg</span>
                          <span>Costo: ${haul.totalCost.toFixed(2)} ARS</span>
                          <span>
                            {new Date(haul.createdAt).toLocaleDateString('es-AR')}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
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
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
