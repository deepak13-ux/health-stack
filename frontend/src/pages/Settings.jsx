import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as admin from "../api/admin";
import { useAuth } from "../context/AuthContext";
import { useSnapshot, useQ } from "../hooks";
import {
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  Textarea,
} from "../components/ui";
import { ConfirmDialog, Err, Gate, Tabs, useToast } from "../components/ui2";

function Profile() {
  const { user, refresh } = useAuth();
  const [toast, show] = useToast();
  const [f, setF] = useState({
    name: user.name,
    phone: user.employment?.phone || user.phone || "",
  });
  const [err, setErr] = useState("");
  const save = async () => {
    setErr("");
    try {
      await admin.updateProfile(user.id, f);
      refresh();
      show("Profile saved.");
    } catch (e) {
      setErr(e.message);
    }
  };
  return (
    <Card className="max-w-lg">
      {toast}
      <Err msg={err} />
      <div className="size-14 rounded-full bg-softblue text-primary grid place-items-center text-xl font-semibold mb-4">
        {user.name.replace(/^(Dr\.|Nurse)\s/, "")[0]}
      </div>
      <div className="space-y-3">
        <Field label="Display name" required>
          <Input
            value={f.name}
            onChange={(e) => setF({ ...f, name: e.target.value })}
          />
        </Field>
        <Field label="Phone">
          <Input
            value={f.phone}
            onChange={(e) => setF({ ...f, phone: e.target.value })}
          />
        </Field>
        <p className="text-muted">
          Email: {user.email} · Role: {user.role}
        </p>
        <Button onClick={save}>Save changes</Button>
      </div>
    </Card>
  );
}

function Hospital() {
  const s = useSnapshot();
  const [toast, show] = useToast();
  const [err, setErr] = useState("");
  const [f, setF] = useState(null);
  return (
    <Gate s={s}>
      {(db) => {
        const v = f || db.settings;
        const set = (k) => (e) => setF({ ...v, [k]: e.target.value });
        return (
          <Card className="max-w-lg">
            {toast}
            <Err msg={err} />
            <div className="space-y-3">
              <Field label="Hospital name" required>
                <Input value={v.name} onChange={set("name")} />
              </Field>
              <Field label="Address">
                <Textarea value={v.address} onChange={set("address")} />
              </Field>
              <Field label="Contact phone">
                <Input value={v.phone} onChange={set("phone")} />
              </Field>
              <Field
                label="Invoice prefix"
                helper="Applies to newly generated invoices only."
              >
                <Input
                  value={v.invoicePrefix}
                  onChange={set("invoicePrefix")}
                />
              </Field>
              <Field label="Default consultation fee (₹)">
                <Input
                  type="number"
                  min="0"
                  value={v.defaultFee}
                  onChange={set("defaultFee")}
                />
              </Field>
              <p className="text-muted">
                Currency: INR · Timezone: Asia/Kolkata (read-only in v1)
              </p>
              <Button
                onClick={async () => {
                  setErr("");
                  try {
                    await admin.saveSettings({
                      ...v,
                      defaultFee: +v.defaultFee,
                    });
                    show("Settings saved.");
                    s.reload();
                  } catch (e) {
                    setErr(e.message);
                  }
                }}
              >
                Save changes
              </Button>
            </div>
          </Card>
        );
      }}
    </Gate>
  );
}

function Demo() {
  const [ask, setAsk] = useState(false);
  const nav = useNavigate();
  return (
    <Card className="max-w-lg">
      <p className="mb-3">
        All records are fictional and stored in this browser only. Resetting
        restores the original sample data relative to today.
      </p>
      <Button variant="danger" onClick={() => setAsk(true)}>
        Reset demo data
      </Button>
      {ask && (
        <ConfirmDialog
          title="Reset demo records?"
          danger
          confirmLabel="Reset"
          requireText="RESET"
          onCancel={() => setAsk(false)}
          onConfirm={async () => {
            await admin.resetDemo();
            nav(0);
          }}
        >
          Every patient, appointment, invoice and change you made will be
          replaced by fresh sample data.
        </ConfirmDialog>
      )}
    </Card>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const [get, set] = useQ({ tab: "profile" });
  const tabs = [
    ["profile", "Profile"],
    ...(user.role === "admin"
      ? [
          ["hospital", "Hospital"],
          ["demo", "Demo data"],
        ]
      : []),
  ];
  return (
    <>
      <PageHeader
        title="Settings"
        description="Your profile and workspace configuration."
      />
      <Tabs value={get("tab")} onChange={(t) => set({ tab: t })} tabs={tabs} />
      {get("tab") === "profile" && <Profile />}
      {get("tab") === "hospital" && user.role === "admin" && <Hospital />}
      {get("tab") === "demo" && user.role === "admin" && <Demo />}
    </>
  );
}
