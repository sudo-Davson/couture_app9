import React, { forwardRef } from 'react';
import { Client, Order } from '@/types';
import { Scissors } from 'lucide-react';

type ReceiptProps = {
  client: Client;
  order: Order;
};

export const ReceiptTemplate = forwardRef<HTMLDivElement, ReceiptProps>(({ client, order }, ref) => {
  const reste = order.price - order.advance;
  
  return (
    <div 
      ref={ref} 
      className="bg-white p-8 w-[400px] text-slate-900 font-sans"
      style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}
    >
      <div className="flex flex-col items-center border-b-2 border-slate-900 pb-6 mb-6">
        <div className="p-4 bg-slate-900 text-white rounded-full mb-4">
          <Scissors size={32} />
        </div>
        <h1 className="text-3xl font-black uppercase tracking-widest">Reçu</h1>
        <p className="text-sm font-bold text-slate-500 mt-1">Couture App</p>
      </div>

      <div className="space-y-4 mb-8">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Client</p>
          <p className="text-lg font-black">{client.name}</p>
          <p className="text-sm font-semibold">{client.phone}</p>
        </div>

        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Commande</p>
          <p className="text-lg font-black">{order.type}</p>
          <p className="text-sm font-semibold text-slate-600">
            Prévue le {new Date(order.deliveryDate).toLocaleDateString('fr-FR')}
          </p>
        </div>
      </div>

      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
        <div className="flex justify-between text-sm font-bold">
          <span className="text-slate-500">Prix total</span>
          <span>{order.price} FCFA</span>
        </div>
        <div className="flex justify-between text-sm font-bold">
          <span className="text-slate-500">Avance payée</span>
          <span>{order.advance} FCFA</span>
        </div>
        <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between">
          <span className="font-black">Reste à payer</span>
          <span className="font-black text-red-600">{reste > 0 ? `${reste} FCFA` : 'PAYÉ'}</span>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs font-bold text-slate-400">Merci de votre confiance !</p>
      </div>
    </div>
  );
});

ReceiptTemplate.displayName = 'ReceiptTemplate';
