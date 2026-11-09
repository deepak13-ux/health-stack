import { Link, useNavigate } from "react-router-dom";
import { useSnapshot, useQ } from "../../hooks";
import {
  Badge,
  Button,
  Card,
  Empty,
  Field,
  Input,
  PageHeader,
  Select,
  Table,
  fmtDate,
  inr,
} from "../../components/ui";
import { Gate, Pager, paginate } from "../../components/ui2";
import {
  balanceOf,
  bills,
  billStatus,
  byId,
  sumPaid,
} from "../../lib/selectors";
import { ymd } from "../../api/mockDb";

export default function Billing() {
  const s = useSnapshot();
  const nav = useNavigate();
  const today = ymd();
  const [get, set] = useQ({ q: "", status: "", from: "", to: "", page: "1" });
  return (
    <>
      <PageHeader
        title="Billing"
        description="Invoices, payments and balances."
        action={
          <Button onClick={() => nav("/admin/billing/new")}>
            Create invoice
          </Button>
        }
      />
      <Gate s={s}>
        {(db) => {
          const P = byId(db.users);
          const q = get("q").toLowerCase();
          const rows = bills(db)
            .filter(
              (b) =>
                (!get("status") || billStatus(b, today) === get("status")) &&
                (!get("from") || b.issueDate >= get("from")) &&
                (!get("to") || b.issueDate <= get("to")) &&
                (!q ||
                  `${b.number} ${P[b.patientId]?.name}`
                    .toLowerCase()
                    .includes(q)),
            )
            .sort((a, b) => b.issueDate.localeCompare(a.issueDate));
          const live = rows.filter((b) => b.state === "issued");
          const sum = (f) => live.reduce((a, b) => a + f(b), 0);
          const tiles = [
            ["Issued", sum((b) => b.total)],
            ["Collected", sum(sumPaid)],
            ["Outstanding", sum(balanceOf)],
            [
              "Overdue",
              sum((b) =>
                billStatus(b, today) === "overdue" ? balanceOf(b) : 0,
              ),
            ],
          ];
          const pg = paginate(rows, +get("page"));
          return (
            <>
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
                {tiles.map(([l, v]) => (
                  <div
                    key={l}
                    className="bg-white border border-line rounded-2xl px-5 py-3"
                  >
                    <p className="text-xs font-semibold text-muted">{l}</p>
                    <p className="text-xl font-semibold tabular-nums">
                      {inr(v)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="grid sm:grid-cols-4 gap-3 mb-4">
                <Field label="Search">
                  <Input
                    placeholder="Invoice or patient"
                    value={get("q")}
                    onChange={(e) => set({ q: e.target.value })}
                  />
                </Field>
                <Field label="Status">
                  <Select
                    value={get("status")}
                    onChange={(e) => set({ status: e.target.value })}
                  >
                    <option value="">All</option>
                    {[
                      "draft",
                      "unpaid",
                      "partial",
                      "paid",
                      "overdue",
                      "void",
                    ].map((x) => (
                      <option key={x} value={x}>
                        {x === "partial"
                          ? "Partially paid"
                          : x[0].toUpperCase() + x.slice(1)}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Issued from">
                  <Input
                    type="date"
                    value={get("from")}
                    onChange={(e) => set({ from: e.target.value })}
                  />
                </Field>
                <Field label="Issued to">
                  <Input
                    type="date"
                    value={get("to")}
                    onChange={(e) => set({ to: e.target.value })}
                  />
                </Field>
              </div>
              <Card>
                {rows.length === 0 ? (
                  <Empty title="No invoices match these filters.">
                    {(get("q") ||
                      get("status") ||
                      get("from") ||
                      get("to")) && (
                      <Button
                        variant="secondary"
                        onClick={() =>
                          set({ q: "", status: "", from: "", to: "" })
                        }
                      >
                        Clear filters
                      </Button>
                    )}
                  </Empty>
                ) : (
                  <>
                    <Table
                      caption="Invoices"
                      heads={[
                        "Invoice",
                        "Patient",
                        "Issued",
                        "Due",
                        "Total",
                        "Balance",
                        "Status",
                      ]}
                    >
                      {pg.rows.map((b) => (
                        <tr key={b.id}>
                          <td>
                            <Link
                              className="text-primary font-medium tabular-nums"
                              to={`/admin/billing/${b.id}`}
                            >
                              {b.number}
                            </Link>
                          </td>
                          <td>{P[b.patientId]?.name}</td>
                          <td>{fmtDate(b.issueDate)}</td>
                          <td>{fmtDate(b.dueDate)}</td>
                          <td className="tabular-nums">{inr(b.total)}</td>
                          <td className="tabular-nums">{inr(balanceOf(b))}</td>
                          <td>
                            <Badge status={billStatus(b, today)} />
                          </td>
                        </tr>
                      ))}
                    </Table>
                    <Pager pg={pg} onPage={(n) => set({ page: String(n) })} />
                  </>
                )}
              </Card>
            </>
          );
        }}
      </Gate>
    </>
  );
}
