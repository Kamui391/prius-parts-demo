// QPay (sandbox) QR эсвэл дансны мэдээллийг харуулна
import { useState } from "react";
import { Building2, CheckCircle2, Copy, FlaskConical, QrCode } from "lucide-react";
import { formatMnt } from "@shared/format.js";
import { api } from "../api.js";
import { useLang } from "../i18n.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function PaymentPanel({ payment, orderCode, onPaid }) {
  const { t } = useLang();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const simulate = async () => {
    setBusy(true);
    try {
      const order = await api.post(`/me/payments/${payment.id}/simulate`);
      toast.success(t("pay.paid"));
      onPaid?.(order);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const copy = (text) => {
    navigator.clipboard?.writeText(text);
    toast.info(t("common.copied"));
  };

  return (
    <div className="pay-panel">
      <div className="row between">
        <h3 className="row" style={{ "--gap": "8px" }}>{payment.method === "qpay" ? <QrCode /> : <Building2 />} {payment.method === "qpay" ? "QPay" : t("pay.bankTitle")}</h3>
        <span className="tiny muted mono">{t("pay.invoice")}: {payment.invoiceNo}</span>
      </div>
      <div className="pay-panel__amount">
        <span className="small muted">{t("pay.amount")}</span>
        <strong className="num">{formatMnt(payment.amount)}</strong>
      </div>
      {payment.method === "qpay" ? (
        <>
          <div className="pay-panel__qr"><img src={payment.qrImage} alt="QPay QR" width="220" height="220" /></div>
          <p className="small muted center">{t("pay.scan")}</p>
          <div className="bank-apps">
            {payment.deeplinks.map((d) => <span key={d.name} className="pay-chip">{d.name}</span>)}
          </div>
        </>
      ) : (
        <div className="stack">
          <div className="copy-row"><span className="grow">{payment.bankInfo}</span></div>
          <div className="copy-row">
            <span className="grow"><span className="tiny muted">{t("pay.bankRef")}: </span><strong className="mono">{orderCode}</strong></span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => copy(orderCode)}><Copy /> {t("common.copy")}</button>
          </div>
        </div>
      )}
      {payment.sandbox && payment.status !== "paid" && (
        <div className="sandbox">
          <div className="row tiny" style={{ "--gap": "6px" }}><FlaskConical width={15} /> {t("pay.sandboxNote")}</div>
          <button type="button" className="btn btn-amber btn-block mt-2" onClick={simulate} disabled={busy}><CheckCircle2 /> {t("pay.simulate")}</button>
        </div>
      )}
    </div>
  );
}
