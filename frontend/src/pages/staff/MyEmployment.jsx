import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import * as api from "../../api/api";
import { Card, Loading, PageHeader, inr } from "../../components/ui";

export default function MyEmployment() {
  const { user } = useAuth();
  const [me, setMe] = useState(null);
  useEffect(() => {
    api.getMyEmployment(user.id).then(setMe);
  }, [user.id]);
  if (!me) return <Loading />;
  const e = me.employment;
  const pct = Math.round((e.daysWorked / e.workingDays) * 100);
  const earned = Math.round((e.salary / e.workingDays) * e.daysWorked);
  const rows = [
    ["Name", me.name],
    ["Role", me.role[0].toUpperCase() + me.role.slice(1)],
    ["Email", me.email],
    ["Phone", e.phone],
    ["Shift", e.shift],
    [
      "Joined",
      new Date(e.joinedOn).toLocaleDateString("en-IN", { dateStyle: "long" }),
    ],
  ];

  return (
    <>
      <PageHeader
        title="My employment"
        description="Your details, attendance and pay for this month."
      />
      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        <Card title="Basic details">
          <dl className="space-y-3">
            {rows.map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs font-semibold text-muted">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <div className="space-y-6">
          <Card title="Attendance this month">
            <p className="text-[30px] font-semibold tabular-nums">
              {e.daysWorked}
              <span className="text-muted text-lg">
                {" "}
                / {e.workingDays} days
              </span>
            </p>
            <div
              className="h-2.5 rounded-full bg-[#EDF2F6] mt-3"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Days worked"
            >
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-muted mt-2">
              Days worked ÷ working days in the month.
            </p>
          </Card>
          <Card title="Salary">
            <div className="grid sm:grid-cols-2 gap-4 tabular-nums">
              <div>
                <p className="text-xs font-semibold text-muted">
                  Monthly salary
                </p>
                <p className="text-[30px] font-semibold">{inr(e.salary)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted">
                  Earned so far
                </p>
                <p className="text-[30px] font-semibold">{inr(earned)}</p>
              </div>
            </div>
            <p className="text-xs text-muted mt-2">
              Earned = salary ÷ working days × days worked. Demo figures only.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
