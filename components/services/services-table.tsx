"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Clock } from "lucide-react";

type Service = {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  isActive: boolean;
  category: { name: string; color: string } | null;
};

export function ServicesTable({ services }: { services: Service[] }) {
  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-6 py-3 font-medium text-gray-600">Serviço</th>
              <th className="text-left px-6 py-3 font-medium text-gray-600">Categoria</th>
              <th className="text-left px-6 py-3 font-medium text-gray-600">Duração</th>
              <th className="text-left px-6 py-3 font-medium text-gray-600">Preço</th>
              <th className="text-left px-6 py-3 font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {services.map((service) => (
              <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">{service.name}</p>
                  {service.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{service.description}</p>
                  )}
                </td>
                <td className="px-6 py-4">
                  {service.category ? (
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: service.category.color + "20",
                        color: service.category.color,
                      }}
                    >
                      {service.category.name}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Clock className="w-3.5 h-3.5" />
                    {service.duration} min
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">
                  {formatCurrency(service.price)}
                </td>
                <td className="px-6 py-4">
                  <Badge variant={service.isActive ? "success" : "danger"}>
                    {service.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {services.length === 0 && (
          <p className="px-6 py-8 text-center text-sm text-gray-500">
            Nenhum serviço cadastrado.
          </p>
        )}
      </div>
    </Card>
  );
}
