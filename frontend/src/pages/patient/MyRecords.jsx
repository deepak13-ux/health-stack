import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import * as api from "../../api/api";
import BillCard from "../../components/BillCard";
import {
  Button,
  Card,
  Empty,
  Loading,
  Modal,
  PageHeader,
  Select,
  inr,
} from "../../components/ui";

export default function MyRecords() {
  const { user } = useAuth();
  const [rx, setRx] = useState(null);
  const [bills, setBills] = useState(null);
  const [paying, setPaying] = useState(null);
  const [method, setMethod] = useState("UPI");
  const load = () => {
    api.listMyPrescriptions(user.id).then(setRx);
    api.listMyBills(user.id).then(setBills);
  };
  useEffect(load, []); // eslint-disable-line

  const pay = async () => {
    await api.payBill(paying.id, method);
    setPaying(null);
    load();
  };

  return (
    <>
      <PageHeader
        title="Prescriptions & bills"
        description="Created automatically when a doctor completes your visit."
      />
      <div className="grid xl:grid-cols-2 gap-6">
        <section aria-labelledby="rx-h">
          <h2 id="rx-h" className="text-lg font-semibold mb-3">
            Prescriptions
          </h2>
          {!rx ? (
            <Loading />
          ) : rx.length === 0 ? (
            <Card>
              <Empty title="No prescriptions yet." />
            </Card>
          ) : (
            <div className="space-y-4">
              {rx.map((r) => (
                <Card key={r.id}>
                  <div className="flex justify-between mb-2">
                    <div>
                      <p className="font-semibold">{r.doctor.name}</p>
                      <p className="text-xs text-muted">
                        {new Date(r.createdAt).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      className="no-print"
                      onClick={() => window.print()}
                    >
                      Print
                    </Button>
                  </div>
                  {r.notes && (
                    <p className="mb-3">
                      <b>Doctor’s notes:</b> {r.notes}
                    </p>
                  )}
                  {r.items.length === 0 ? (
                    <p className="text-muted">No medicines prescribed.</p>
                  ) : (
                    <ul className="divide-y divide-line">
                      {r.items.map((m, i) => (
                        <li key={i} className="py-2 flex justify-between">
                          <span>
                            {m.name}
                            <span className="text-muted">
                              {" "}
                              · {m.dosage || "As directed"}
                            </span>
                          </span>
                          <span className="tabular-nums">× {m.qty}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              ))}
            </div>
          )}
        </section>
        <section aria-labelledby="bill-h">
          <h2 id="bill-h" className="text-lg font-semibold mb-3">
            Bills
          </h2>
          {!bills ? (
            <Loading />
          ) : bills.length === 0 ? (
            <Card>
              <Empty title="No bills yet." />
            </Card>
          ) : (
            <div className="space-y-4">
              {bills.map((b) => (
                <BillCard key={b.id} bill={b} onPay={setPaying} />
              ))}
            </div>
          )}
        </section>
      </div>
      {paying && (
        <Modal title={`Pay ${paying.number}`} onClose={() => setPaying(null)}>
          <p className="mb-3">
            Amount due: <b className="tabular-nums">{inr(paying.total)}</b>
          </p>
          <Select
            aria-label="Payment method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            <option>UPI</option>
            <option>Card</option>
            <option>Cash</option>
          </Select>
          <p className="text-xs text-muted mt-2">
            Demo only. No real payment is made.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={() => setPaying(null)}>
              Cancel
            </Button>
            <Button onClick={pay}>Confirm payment</Button>
          </div>
        </Modal>
      )}
    </>
  );
}
