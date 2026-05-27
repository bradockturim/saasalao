"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatPhone, getInitials } from "@/lib/utils";
import { Search } from "lucide-react";

type Client = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  createdAt: Date;
  isActive: boolean;
  _count: { appointments: number };
};

export function ClientsTable({ clients }: { clients: Client[] }) {
  const [search, setSearch] = useState("");

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card>
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar clientes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-6 py-3 font-medium text-gray-600">Cliente</th>
              <th className="text-left px-6 py-3 font-medium text-gray-600">Telefone</th>
              <th className="text-left px-6 py-3 font-medium text-gray-600">Agendamentos</th>
              <th className="text-left px-6 py-3 font-medium text-gray-600">Cadastrado em</th>
              <th className="text-left px-6 py-3 font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary-600">
                        {getInitials(client.name)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{client.name}</p>
                      {client.email && (
                        <p className="text-xs text-gray-500">{client.email}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{formatPhone(client.phone)}</td>
                <td className="px-6 py-4 text-gray-600">{client._count.appointments}</td>
                <td className="px-6 py-4 text-gray-600">{formatDate(client.createdAt)}</td>
                <td className="px-6 py-4">
                  <Badge variant={client.isActive ? "success" : "danger"}>
                    {client.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="px-6 py-8 text-center text-sm text-gray-500">
            Nenhum cliente encontrado.
          </p>
        )}
      </div>
    </Card>
  );
}
