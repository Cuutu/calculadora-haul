'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ProductTable } from '@/components/product-table';
import { ShippingSection } from '@/components/shipping-section';
import { TaxSection } from '@/components/tax-section';
import { ExchangeRateDisplay } from '@/components/exchange-rate-display';
import Navbar from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import type { Product, ExchangeRates, Haul } from '@/types';

const YUAN_TO_USD = 0.14;

export default function EditHaulPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const haulId = params.id as string;

  const [haul, setHaul] = useState<Haul | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [shippingUSD, setShippingUSD] = useState(0);
  const [useFranquicia, setUseFranquicia] = useState(true);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [haulName, setHaulName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (session && haulId) {
      fetchHaul();
      fetchExchangeRates();
    }
  }, [session, status, router, haulId]);

  const fetchHaul = async () => {
    try {
      const response = await fetch(`/api/hauls/${haulId}`);
      if (response.ok) {
        const data = await response.json();
        setHaul(data);
        setProducts(data.products);
        setHaulName(data.name);
        setExchangeRates(data.exchangeRates);
        setShippingUSD(data.shippingUSD || 0);
      } else {
        router.push('/hauls');
      }
    } catch (error) {
      console.error('Error fetching haul:', error);
      router.push('/hauls');
    } finally {
      setLoading(false);
    }
  };

  const fetchExchangeRates = async () => {
    try {
      const response = await fetch('/api/exchange-rates');
      const data = await response.json();
      setExchangeRates(data);
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
    }
  };

  const totalProductsUSD = products.reduce((sum, p) => sum + p.precioUSD * p.cantidad, 0);

  const saveHaul = async () => {
    if (!haulName.trim()) {
      alert('Por favor ingresa un nombre para tu haul');
      return;
    }

    if (!exchangeRates) {
      alert('Espera a que se carguen las tasas de cambio');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/hauls/${haulId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: haulName,
          products,
          exchangeRates,
          shippingUSD,
        }),
      });

      if (response.ok) {
        alert('¡Haul actualizado exitosamente! 🎉');
        setShowSaveModal(false);
        router.push('/hauls');
      } else {
        alert('Error al actualizar el haul');
      }
    } catch (error) {
      console.error('Error updating haul:', error);
      alert('Error al actualizar el haul');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
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

  if (!session || !haul) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <header className="text-center space-y-2 mb-8">
            <h1 className="text-4xl md:text-5xl text-primary font-sans font-extrabold leading-7 tracking-normal">
              EDITAR HAUL
            </h1>
            <p className="text-muted-foreground text-lg font-mono">
              Modifica tu haul: {haul.name}
            </p>
          </header>

          <ExchangeRateDisplay exchangeRates={exchangeRates} loading={false} onRefresh={fetchExchangeRates} />

          <ProductTable
            products={products}
            setProducts={setProducts}
            exchangeRates={exchangeRates}
            yuanToUSD={YUAN_TO_USD}
          />

          <ShippingSection shippingUSD={shippingUSD} setShippingUSD={setShippingUSD} exchangeRates={exchangeRates} />

          <TaxSection
            totalProductsUSD={totalProductsUSD}
            shippingUSD={shippingUSD}
            useFranquicia={useFranquicia}
            setUseFranquicia={setUseFranquicia}
            exchangeRates={exchangeRates}
          />

          {/* Botón de Guardar Cambios */}
          <div className="flex justify-center">
            <Button
              onClick={() => setShowSaveModal(true)}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            >
              💾 Guardar Cambios
            </Button>
          </div>

          <footer className="text-center text-sm text-muted-foreground pt-8 border-t-2 border-primary">
            <p>•Tasas actualizadas desde dolarito.ar • </p>
          </footer>
        </div>
      </main>

      {/* Modal de Guardar Cambios */}
      <Modal
        isOpen={showSaveModal}
        onClose={() => {
          setShowSaveModal(false);
        }}
        title="Guardar Cambios"
        onConfirm={saveHaul}
        confirmText={saving ? 'Guardando...' : 'Guardar'}
        confirmDisabled={saving || !haulName.trim()}
      >
        <div>
          <Label htmlFor="modalHaulName">Nombre del haul</Label>
          <Input
            id="modalHaulName"
            value={haulName}
            onChange={(e) => setHaulName(e.target.value)}
            placeholder="Mi haul de invierno 2024"
            className="mt-1"
            autoFocus
          />
          <p className="text-sm text-gray-500 mt-2">
            Este nombre te ayudará a identificar tu haul más tarde
          </p>
        </div>
      </Modal>
    </div>
  );
}
