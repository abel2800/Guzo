'use client';

import { BookOpen, Package, CreditCard, Truck, HelpCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { FuturisticHero } from '@/components/dashboard/futuristic-primitives';

const ARTICLES = [
  {
    icon: Package,
    title: 'How to track a shipment',
    body: 'Customers can track from the dashboard or public /track page using order number or tracking barcode.',
  },
  {
    icon: Truck,
    title: 'Driver assignment delays',
    body: 'Confirm the order is CONFIRMED and a driver is approved. Check exceptions center for failed deliveries.',
  },
  {
    icon: CreditCard,
    title: 'Payment & refunds',
    body: 'Paid orders show in Finance → Payments. Issue refunds from the payment detail or finance refunds view.',
  },
  {
    icon: HelpCircle,
    title: 'Branch pickup PIN',
    body: 'Recipients need the pickup PIN from their label or SMS. Branch staff verifies via counter pickup flow.',
  },
];

export function SupportKnowledgeBase() {
  return (
    <div className="space-y-6">
      <FuturisticHero
        eyebrow="Self-service"
        icon={BookOpen}
        title="Knowledge base"
        description="Quick answers for support agents handling tickets and customer calls."
        stats={[{ label: 'Articles', value: String(ARTICLES.length) }]}
      />
      <div className="grid gap-3 md:grid-cols-2">
        {ARTICLES.map((a) => (
          <Card key={a.title}>
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center gap-2">
                <a.icon className="h-4 w-4 text-guzo-primary" />
                <p className="font-semibold text-white">{a.title}</p>
              </div>
              <p className="text-sm text-muted-foreground">{a.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
