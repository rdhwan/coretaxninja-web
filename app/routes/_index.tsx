import { dataWithError, dataWithSuccess } from "remix-toast";
import type { Route } from "./+types/_index";
import { unstable_userMiddleware } from "~/utils/auth.server";
import { data, Form, useFetcher } from "react-router";
import { Command, Hexagon, LogOut } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import ENV from "~/utils/env.server";
import axios from "axios";
import type { Company, Invoices } from "~/types/invoice";
import { success } from "zod";
import {
  createPayload,
  createPreview,
  generateXML,
} from "~/utils/invoice.server";
import { useEffect, useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header";
import ControlledDataTable from "~/components/data-table";
import { DataTableActionBar } from "~/components/data-table/data-table-action-bar";
import { rupiahFormatter } from "~/lib/format";
import { Checkbox } from "~/components/ui/checkbox";
import { useDataTable } from "~/hooks/use-data-table";
import { DataTable } from "~/components/data-table/data-table";
import { DataTableToolbar } from "~/components/data-table/data-table-toolbar";
import { DataTableSortList } from "~/components/data-table/data-table-sort-list";
import { setToast } from "remix-toast/middleware";

export const loader = async ({ request }: Route.LoaderArgs) => {
  try {
    const now = new Date().toISOString().split("T")[0];
    const company = await axios.get<Company>(
      ENV.S_NINJA_API_URL + "/companies",
      {
        headers: {
          "Content-Type": "application/json",
          "X-Api-Token": ENV.S_NINJA_API_KEY,
        },
      }
    );

    const invoices = await axios.get<Invoices>(
      ENV.S_NINJA_API_URL + "/invoices",
      {
        headers: {
          "Content-Type": "application/json",
          "X-Api-Token": ENV.S_NINJA_API_KEY,
        },
        params: {
          page: 1,
          per_page: 10,
          updated_at: now, //only today
          include: "client",
        },
      }
    );

    return {
      company: company.data.data[0],
      invoices: createPreview(
        invoices.data.data.filter((invoice) => invoice.total_taxes > 0)
      ), // Filter invoices with taxes
      ENV: {
        C_COMPANY_NAME: ENV.C_COMPANY_NAME,
      },
    };
  } catch (err) {
    console.error("Error fetching company data:", err);

    throw dataWithError(
      { success: false, message: "Failed to load company data." },
      "Failed to load company data.",
      { status: 500 }
    );
  }
};

export const action = async ({ request, context }: Route.ActionArgs) => {
  try {
    const formData = await request.formData();

    const ids = (formData.get("ids") as string).split(",");

    const now = new Date().toISOString().split("T")[0];

    const invoices = await axios.get<Invoices>(
      ENV.S_NINJA_API_URL + "/invoices",
      {
        headers: {
          "Content-Type": "application/json",
          "X-Api-Token": ENV.S_NINJA_API_KEY,
        },
        params: {
          page: 1,
          per_page: 10,
          updated_at: now, //only today
          include: "client",
        },
      }
    );

    const company = await axios.get<Company>(
      ENV.S_NINJA_API_URL + "/companies",
      {
        headers: {
          "Content-Type": "application/json",
          "X-Api-Token": ENV.S_NINJA_API_KEY,
        },
      }
    );

    const payload = createPayload(
      company.data.data,
      invoices.data.data.filter((invoice) => ids.includes(invoice.id)),
      now
    );

    const xml = generateXML(payload);

    return dataWithSuccess(xml, "Invoices exported successfully!", {
      headers: {
        "Content-Disposition": `attachment; filename="invoices_${now}.xml"`,
        "Content-Type": "application/xml",
      },
    });
  } catch (err) {
    console.error("Error exporting invoices:", err);

    throw dataWithError(
      { success: false, message: "Failed to export invoices." },
      "Failed to export invoices.",
      { status: 500 }
    );
  }
};

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const fetcher = useFetcher();
  const { ENV, company, invoices } = loaderData;

  type InvoicePreview = (typeof invoices)[number];

  useEffect(() => {
    if (fetcher.data) {
      // download the XML file
      const blob = new Blob([fetcher.data], { type: "application/xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = `invoices_${new Date().toISOString().split("T")[0]}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [fetcher.data]);

  const columns = useMemo<ColumnDef<InvoicePreview>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        size: 32,
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: "client",
        accessorKey: "client",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Client" />
        ),
        cell: ({ cell }) => {
          const client = cell.getValue<InvoicePreview["client"]>();
          return <span>{client}</span>;
        },
        meta: {
          label: "Client",
          placeholder: "client",
          variant: "text",
        },
        enableColumnFilter: false,
        enableSorting: false,
      },
      {
        id: "amount",
        accessorKey: "amount",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Total" />
        ),
        cell: ({ cell }) => {
          const amount = cell.getValue<InvoicePreview["amount"]>();
          return <span>{rupiahFormatter.format(amount)}</span>;
        },
        meta: {
          label: "Total",
          placeholder: "amount",
          variant: "text",
        },
        enableColumnFilter: false,
        enableSorting: false,
      },
      {
        id: "total_taxes",
        accessorKey: "total_taxes",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="PPn (11%)" />
        ),
        cell: ({ cell }) => {
          const total_taxes = cell.getValue<InvoicePreview["total_taxes"]>();
          return <span>{rupiahFormatter.format(total_taxes)}</span>;
        },
        meta: {
          label: "PPn (11%)",
          placeholder: "total_taxes",
          variant: "text",
        },
        enableColumnFilter: false,
        enableSorting: false,
      },
    ],
    []
  );

  const { table, rowSelection } = useDataTable<InvoicePreview>({
    columns,
    data: invoices,
    pageCount: 1,
    getRowId: (row) => row.id,
  });

  return (
    <div className="flex flex-1 flex-col min-h-screen relative z-10">
      {/* Header */}
      <header className="flex items-center justify-between py-4 px-4 border-b border-slate-700/50 dark:border-slate-700/50 light:border-slate-300/50">
        <div className="flex items-center space-x-2">
          {/* <Hexagon className="h-8 w-8 text-cyan-500" /> */}
          <img src={company.settings.company_logo} className="h-8 w-8" />"
          <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            {company.settings.name}
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-400 hover:text-red-400 dark:text-slate-400 dark:hover:text-red-400 light:text-slate-600 light:hover:text-red-500"
                  onClick={() => {
                    fetcher.submit(null, {
                      method: "post",
                      action: "/auth/logout",
                    });
                  }}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Logout</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Avatar>
            <AvatarImage src={company.settings.company_logo} alt="User" />
            <AvatarFallback className="bg-slate-700 text-cyan-500 dark:bg-slate-700 dark:text-cyan-500 light:bg-slate-200 light:text-cyan-600">
              {ENV.C_COMPANY_NAME.split(" ")
                .map((word) => word[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Main area: sidebar + content */}
      <div className="flex flex-1 flex-col md:flex-row min-h-0 p-2 gap-2">
        {/* Sidebar */}
        <aside className="w-full md:w-64 h-[12rem] flex-shrink-0">
          <Card className="bg-slate-900/50 border-slate-700/50 dark:bg-slate-900/50 dark:border-slate-700/50 light:bg-white/80 light:border-slate-300/50 backdrop-blur-sm h-full">
            <CardContent className="p-4 h-full flex flex-col justify-between">
              <nav className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start bg-slate-800/70 text-cyan-400 dark:bg-slate-800/70 dark:text-cyan-400 light:bg-slate-100 light:text-cyan-600"
                >
                  <Command className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              </nav>

              <div className="mt-8 pt-6 border-t border-slate-700/50 dark:border-slate-700/50 light:border-slate-300/50">
                <div className="text-xs text-slate-500 dark:text-slate-500 light:text-slate-600 mb-2 font-mono">
                  SYSTEM STATUS
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">
                      Overall
                    </span>
                    <span className="text-xs text-cyan-400 dark:text-cyan-400 light:text-cyan-600">
                      {100}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Main dashboard content */}
        <main className="flex-1 h-full w-full bg-white light:border-slate-300/50 p-6 overflow-auto flex flex-col rounded-2xl border-slate-700/50 dark:bg-slate-900/50 dark:border-slate-700/50 light:bg-white/80 light:border-slate-300/50 border-[1px] backdrop-blur-sm">
          {/* Place your dashboard content here */}

          <DataTable table={table}>
            <DataTableToolbar table={table}>
              <DataTableSortList table={table} />
            </DataTableToolbar>
          </DataTable>

          <Button
            disabled={Object.keys(rowSelection).length === 0}
            // stylize the button to have the same background as the main area
            className="bg-slate-800 my-8 hover:bg-slate-800/80 text-cyan-400 dark:bg-slate-800 dark:hover:bg-slate-800/80 dark:text-cyan-400 light:bg-slate-100 light:hover:bg-slate-100/80 light:text-cyan-600"
            onClick={() => {
              fetcher.submit(
                {
                  ids: Object.keys(rowSelection).filter(
                    (key) => rowSelection[key]
                  ),
                },
                {
                  method: "post",
                }
              );
            }}
          >
            Export
          </Button>
        </main>
      </div>
    </div>
  );
}

export const unstable_middleware = [unstable_userMiddleware];
