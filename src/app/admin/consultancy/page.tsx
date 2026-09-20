"use client";
import { useEffect, useState } from "react";
import {
  HeartHandshake,
  Loader2,
  Save,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/firebase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { defaultMatrimonialCommissionPolicy } from "@/lib/matrimonial-iba-commission";

export default function ConsultancyAdmin() {
  const { user } = useAuth(),
    { toast } = useToast();
  const [data, setData] = useState<any>(null),
    [busy, setBusy] = useState(false),
    [draft, setDraft] = useState({
      documentType: "MATRIMONIAL_SERVICE_AGREEMENT",
      serviceType: "Matrimonial Bureau",
      jurisdiction: "India / Maharashtra",
      instructions: "",
    }),
    [draftText, setDraftText] = useState("");
  useEffect(() => {
    if (user) load();
  }, [user]);
  async function api(method = "GET", body?: any) {
    const token = await user!.getIdToken(),
      r = await fetch("/api/admin/consultancy", {
        method,
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      }),
      d = await r.json();
    if (!r.ok) throw new Error(d.error);
    return d;
  }
  async function load() {
    setData(await api());
  }
  async function act(body: any, message: string, reload = true) {
    setBusy(true);
    try {
      const result = await api("POST", body);
      toast({ title: message });
      if (reload) await load();
      return result;
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Action failed",
        description: e instanceof Error ? e.message : "Request failed",
      });
    } finally {
      setBusy(false);
    }
  }
  if (!data)
    return (
      <div className="p-10">
        <Loader2 className="animate-spin" />
      </div>
    );
  const c = data.config,
    m = data.metrics;
  return (
    <main className="p-4 md:p-8 space-y-6">
      <header>
        <h1 className="text-3xl font-black flex gap-2">
          <HeartHandshake />
          Life & Relationship Consultancy
        </h1>
        <p className="text-muted-foreground">
          Admin controls configuration, verification, contact release, fees,
          documents, counselling and fair complaint review.
        </p>
      </header>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(m)
          .slice(0, 12)
          .map(([k, v]) => (
            <Card key={k}>
              <CardContent className="pt-5">
                <p className="text-xs uppercase text-muted-foreground">
                  {words(k)}
                </p>
                <p className="text-2xl font-black">{String(v)}</p>
              </CardContent>
            </Card>
          ))}
      </div>
      <Tabs defaultValue="settings">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="profiles">Profiles</TabsTrigger>
          <TabsTrigger value="meetings">Meetings</TabsTrigger>
          <TabsTrigger value="iba-referrals">IBA Referrals</TabsTrigger>
          <TabsTrigger value="counselling">Counselling</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="complaints">Complaints</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature & Pricing</CardTitle>
              <CardDescription>
                These values are defaults and remain Admin controlled.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <Toggle
                label="Consultancy enabled"
                value={c.enabled}
                set={(v) => setData({ ...data, config: { ...c, enabled: v } })}
              />
              <Toggle
                label="Counselling enabled"
                value={c.counsellingEnabled}
                set={(v) =>
                  setData({ ...data, config: { ...c, counsellingEnabled: v } })
                }
              />
              <Money
                label="Registration regular fee"
                value={c.registrationFee.regularAmount}
                set={(v) => fee("registrationFee", "regularAmount", v)}
              />
              <Money
                label="Registration discount %"
                value={c.registrationFee.discount.value}
                set={(v) => discount("registrationFee", v)}
              />
              <Money
                label="Meeting fee per customer"
                value={c.meetingFee.regularAmount}
                set={(v) => fee("meetingFee", "regularAmount", v)}
              />
              <Money
                label="Meeting discount %"
                value={c.meetingFee.discount.value}
                set={(v) => discount("meetingFee", v)}
              />
              <Money
                label="Success fee per customer"
                value={c.successFee.regularAmount}
                set={(v) => fee("successFee", "regularAmount", v)}
              />
              <Money
                label="Success fee discount %"
                value={c.successFee.discount.value}
                set={(v) => discount("successFee", v)}
              />
              <Money
                label="Counselling advance %"
                value={c.counsellingAdvancePercentage}
                set={(v) =>
                  setData({
                    ...data,
                    config: { ...c, counsellingAdvancePercentage: v },
                  })
                }
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Matrimonial Bureau Status</CardTitle>
              <CardDescription>
                Controls new registrations, profiles, interests and meeting
                payments. Existing records and obligations remain preserved.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <Badge variant={c.matrimonialEnabled ? "default" : "secondary"}>
                {c.matrimonialEnabled ? "ACTIVE" : "INACTIVE"}
              </Badge>
              <Button
                disabled={busy}
                variant={c.matrimonialEnabled ? "destructive" : "default"}
                onClick={() =>
                  confirm(
                    `${c.matrimonialEnabled ? "Deactivate" : "Activate"} Matrimonial Bureau? Existing records and Success Fee obligations will remain unchanged.`,
                  ) &&
                  act(
                    {
                      action: "SET_MATRIMONIAL_STATUS",
                      enabled: !c.matrimonialEnabled,
                    },
                    `Matrimonial Bureau ${c.matrimonialEnabled ? "deactivated" : "activated"}`,
                  )
                }
              >
                {c.matrimonialEnabled
                  ? "Deactivate Matrimonial"
                  : "Activate Matrimonial"}
              </Button>
            </CardContent>
          </Card>
          <div className="flex gap-3">
            <Button
              disabled={busy}
              onClick={() =>
                confirm(
                  "Publish configuration changes? Completed transactions remain unchanged.",
                ) &&
                act(
                  { action: "SAVE_CONFIG", config: c },
                  "Configuration published",
                )
              }
            >
              <Save />
              Save & Publish
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() =>
                act(
                  { action: "SEED_DEFAULTS" },
                  "Default fields and services created",
                )
              }
            >
              Seed Defaults
            </Button>
          </div>
        </TabsContent>
        <TabsContent value="profiles">
          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            <Card>
              <CardHeader>
                <CardTitle>Dynamic Profile Fields</CardTitle>
                <CardDescription>
                  Contact fields must remain Protected or Admin Only.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.profileFields.map((f: any) => (
                  <div key={f.id} className="border rounded-lg p-2 text-sm">
                    <b>{f.label}</b> ({f.key}) • {f.type} • {f.visibility} •{" "}
                    {f.active ? "Active" : "Inactive"}
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Add or Update Field</CardTitle>
              </CardHeader>
              <CardContent>
                <ProfileFieldForm
                  disabled={busy}
                  submit={(field) =>
                    act(
                      { action: "SAVE_PROFILE_FIELD", field },
                      "Profile field saved",
                    )
                  }
                />
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Verification Queue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.profiles.map((p: any) => {
                const v = data.verifications.find((x: any) => x.id === p.id);
                return (
                  <div
                    key={p.id}
                    className="border rounded-lg p-3 flex flex-col md:flex-row justify-between gap-3"
                  >
                    <div>
                      <b>{p.displayName || p.id}</b>
                      <p>
                        Profile: {p.status} • Verification:{" "}
                        {v?.status || "PENDING"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          act(
                            {
                              action: "VERIFY_PROFILE",
                              userId: p.id,
                              status: "VERIFIED",
                              verifiedTypes: c.requiredVerificationTypes,
                            },
                            "Profile verified",
                          )
                        }
                      >
                        <ShieldCheck />
                        Verify
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          act(
                            {
                              action: "VERIFY_PROFILE",
                              userId: p.id,
                              status: "ADDITIONAL_INFORMATION_REQUIRED",
                              remarks: "Additional information required",
                            },
                            "Information requested",
                          )
                        }
                      >
                        Request Info
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          act(
                            {
                              action: "VERIFY_PROFILE",
                              userId: p.id,
                              status: "REJECTED",
                              remarks: "Admin review",
                            },
                            "Profile rejected",
                          )
                        }
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="meetings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Meeting & Contact Review</CardTitle>
              <CardDescription>
                Approval is blocked until both participants pay and satisfy
                verification.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.meetings.map((x: any) => (
                <div key={x.id} className="border rounded-lg p-3">
                  <b>{x.id}</b>
                  <p>Status: {x.status}</p>
                  <p className="text-sm">
                    Participants: {x.participantIds?.join(", ")}
                  </p>
                  <div className="flex gap-2 mt-2">
                    {["VERIFICATION_PENDING", "ADMIN_REVIEW"].includes(
                      x.status,
                    ) && (
                      <Button
                        size="sm"
                        onClick={() =>
                          act(
                            {
                              action: "APPROVE_CONTACT",
                              meetingId: x.id,
                              categories: ["PHONE", "EMAIL"],
                            },
                            "Contact sharing approved",
                          )
                        }
                      >
                        Approve Phone & Email
                      </Button>
                    )}
                    {["CONTACT_APPROVED", "CONFIRMED"].includes(x.status) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          act(
                            { action: "COMPLETE_MEETING", meetingId: x.id },
                            "Meeting completed",
                          )
                        }
                      >
                        Complete Meeting
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Marriage Confirmation</CardTitle>
              <CardDescription>
                Enter exactly two user IDs. This creates two independent Success
                Fee obligations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MarriageForm
                disabled={busy}
                submit={(participantIds, method, meetingId) =>
                  act(
                    {
                      action: "CONFIRM_MARRIAGE",
                      participantIds,
                      meetingId,
                      confirmationMethod: method,
                      dueDays: 7,
                    },
                    "Marriage confirmed; two obligations created",
                  )
                }
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Success Fee Obligations</CardTitle>
              <CardDescription>
                Each customer has an independent obligation. Disputes require
                Admin review.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.obligations.map((o: any) => (
                <div key={o.id} className="border rounded-lg p-3">
                  <b>{o.userId}</b>
                  <p>
                    {o.status} • ₹{o.paidAmount || 0} paid / ₹{o.payableAmount}{" "}
                    due
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[
                      "UNDER_REVIEW",
                      "DUE",
                      "OUTSTANDING",
                      "WAIVED",
                      "SETTLED",
                      "CLOSED",
                    ].map((status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant="outline"
                        disabled={busy || o.status === status}
                        onClick={() =>
                          act(
                            {
                              action: "SUCCESS_FEE_ACTION",
                              obligationId: o.id,
                              status,
                              remarks: `Admin changed status to ${status}`,
                            },
                            `Obligation marked ${status}`,
                          )
                        }
                      >
                        {words(status.toLowerCase())}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="counselling">
          <Card>
            <CardHeader>
              <CardTitle>Counselling Services & Bookings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.services.map((s: any) => (
                <div key={s.id} className="border rounded-lg p-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <b>{s.name}</b>
                      <p>
                        {s.sessionCount} sessions • ₹{s.fee?.regularAmount} •{" "}
                        <Badge variant={s.enabled ? "default" : "secondary"}>
                          {s.enabled ? "ACTIVE" : "INACTIVE"}
                        </Badge>
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={s.enabled ? "destructive" : "default"}
                      disabled={busy}
                      onClick={() =>
                        confirm(
                          `${s.enabled ? "Deactivate" : "Activate"} ${s.name}? Existing bookings and payment history will remain unchanged.`,
                        ) &&
                        act(
                          {
                            action: "SET_SERVICE_STATUS",
                            serviceId: s.id,
                            enabled: !s.enabled,
                          },
                          `Service ${s.enabled ? "deactivated" : "activated"}`,
                        )
                      }
                    >
                      {s.enabled ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </div>
              ))}
              {data.bookings.map((b: any) => (
                <div key={b.id} className="border rounded-lg p-3">
                  <b>{b.serviceName}</b>
                  <p>
                    {b.status} • Advance ₹{b.advancePaid} • Balance ₹
                    {b.balanceDue}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Add Counselling Service</CardTitle>
              </CardHeader>
              <CardContent>
                <ServiceForm
                  disabled={busy}
                  submit={(service) =>
                    act(
                      { action: "SAVE_SERVICE", service },
                      "Counselling service saved",
                    )
                  }
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Availability</CardTitle>
                <CardDescription>
                  India date; comma-separated 24-hour slots such as 10:00,
                  11:00.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AvailabilityForm
                  disabled={busy}
                  submit={(availability) =>
                    act(
                      { action: "SAVE_AVAILABILITY", availability },
                      "Availability saved",
                    )
                  }
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="iba-referrals" className="space-y-4">
          <MatrimonialCommissionSettings
            disabled={busy}
            policies={data.commissionPolicies || []}
            save={(policy) =>
              act(
                { action: "SAVE_MATRIMONIAL_COMMISSION_POLICY", policy },
                "New commission policy draft saved",
              )
            }
            publish={(policyId) =>
              confirm(
                "Publish this commission rule version? Existing commission records will not be recalculated.",
              ) &&
              act(
                {
                  action: "PUBLISH_MATRIMONIAL_COMMISSION_POLICY",
                  policyId,
                },
                "Commission policy published",
              )
            }
          />
          <ReferralOverride
            disabled={busy}
            submit={(value) =>
              act(
                { action: "OVERRIDE_MATRIMONIAL_REFERRAL", ...value },
                "Referral attribution corrected",
              )
            }
          />
          <Card>
            <CardHeader>
              <CardTitle>Referral Attributions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(data.referrals || []).map((r: any) => (
                <div key={r.id} className="border rounded-lg p-3 text-sm">
                  Customer {r.customerId} • IBA {r.ibaUid || "Direct"} •{" "}
                  {r.attributionStatus}
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Matrimonial IBA Commissions</CardTitle>
              <CardDescription>
                Commission is created only from an official qualifying payment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(data.matrimonialCommissions || []).map((x: any) => (
                <div key={x.id} className="border rounded-lg p-3">
                  <b>{x.sourceType}</b>
                  <p className="text-sm">
                    IBA {x.ibaUid} • Customer {x.customerId} • ₹
                    {x.commissionAmount} • {x.status}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Payment: {x.qualifyingPaymentTransactionId} • Rule v
                    {x.ruleVersion}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {x.status === "ELIGIBLE" && (
                      <Button
                        size="sm"
                        onClick={() =>
                          act(
                            {
                              action: "MATRIMONIAL_COMMISSION_ACTION",
                              commissionId: x.id,
                              status: "APPROVED",
                            },
                            "Commission approved",
                          )
                        }
                      >
                        Approve
                      </Button>
                    )}
                    {!["PAID", "REVERSED", "CANCELLED"].includes(x.status) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          act(
                            {
                              action: "MATRIMONIAL_COMMISSION_ACTION",
                              commissionId: x.id,
                              status: "ON_HOLD",
                              reason: "Admin review required",
                            },
                            "Commission placed on hold",
                          )
                        }
                      >
                        Hold
                      </Button>
                    )}
                    {x.status !== "REVERSED" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          const reason = window.prompt(
                            "Enter the verified refund reason (minimum 10 characters). The customer wallet will be credited and the commission reversed.",
                          );
                          if (
                            reason &&
                            reason.trim().length >= 10 &&
                            confirm(
                              "Refund this official payment and reverse its IBA commission?",
                            )
                          )
                            act(
                              {
                                action: "REFUND_MATRIMONIAL_PAYMENT",
                                commissionId: x.id,
                                reason: reason.trim(),
                              },
                              "Payment refunded and commission reversed",
                            );
                        }}
                      >
                        Refund & Reverse
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                <Sparkles className="inline mr-2" />
                Admin AI Draft Assistant
              </CardTitle>
              <CardDescription>
                Output never auto-publishes. Legal review is recommended before
                publication.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                value={draft.documentType}
                onChange={(e) =>
                  setDraft({ ...draft, documentType: e.target.value })
                }
                placeholder="Document type"
              />
              <Input
                value={draft.serviceType}
                onChange={(e) =>
                  setDraft({ ...draft, serviceType: e.target.value })
                }
                placeholder="Service"
              />
              <Textarea
                value={draft.instructions}
                onChange={(e) =>
                  setDraft({ ...draft, instructions: e.target.value })
                }
                placeholder="Fee, trigger, obligations, privacy and complaint process"
              />
              <Button
                disabled={busy}
                onClick={async () => {
                  const r = await act(
                    { action: "AI_DRAFT", ...draft },
                    "Draft generated",
                    false,
                  );
                  if (r) setDraftText(r.draft);
                }}
              >
                Generate Draft
              </Button>
              {draftText && (
                <>
                  <Badge>Draft — Legal Review Recommended</Badge>
                  <Textarea
                    rows={18}
                    value={draftText}
                    onChange={(e) => setDraftText(e.target.value)}
                  />
                  <Button
                    onClick={() =>
                      act(
                        {
                          action: "SAVE_DOCUMENT",
                          document: {
                            documentId: `doc-${Date.now()}`,
                            type: draft.documentType,
                            title: draft.documentType.replaceAll("_", " "),
                            content: draftText,
                            effectiveFrom: new Date().toISOString(),
                          },
                        },
                        "Draft saved",
                      )
                    }
                  >
                    Save New Version
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Document Versions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.documents.map((d: any) => (
                <div
                  className="border rounded-lg p-3 flex justify-between"
                  key={d.id}
                >
                  <div>
                    <b>{d.title}</b>
                    <p>
                      Version {d.version} • {d.status}
                    </p>
                  </div>
                  {d.status !== "PUBLISHED" && d.status !== "ARCHIVED" && (
                    <Button
                      size="sm"
                      onClick={() =>
                        confirm(
                          "Publish this exact version? Previous acceptances remain unchanged.",
                        ) &&
                        act(
                          { action: "PUBLISH_DOCUMENT", versionId: d.id },
                          "Document published",
                        )
                      }
                    >
                      Publish
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="complaints">
          <Card>
            <CardHeader>
              <CardTitle>Fair Complaint Review</CardTitle>
              <CardDescription>
                A complaint does not establish guilt automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.complaints.map((x: any) => (
                <div key={x.id} className="border rounded-lg p-3">
                  <b>{x.category}</b>
                  <p>{x.description}</p>
                  <p>Status: {x.status}</p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        act(
                          {
                            action: "COMPLAINT_DECISION",
                            complaintId: x.id,
                            status: "UNDER_REVIEW",
                            reviewAction: "NO_ACTION",
                          },
                          "Review started",
                        )
                      }
                    >
                      Review
                    </Button>
                    <Button
                      size="sm"
                      onClick={() =>
                        act(
                          {
                            action: "COMPLAINT_DECISION",
                            complaintId: x.id,
                            status: "DECISION",
                            reviewAction: "ADVISORY",
                            responseOpportunityProvided: true,
                            guiltDetermined: false,
                          },
                          "Advisory decision recorded",
                        )
                      }
                    >
                      Advisory
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        act(
                          {
                            action: "COMPLAINT_DECISION",
                            complaintId: x.id,
                            status: "CLOSED",
                            reviewAction: "NO_ACTION",
                          },
                          "Complaint closed",
                        )
                      }
                    >
                      Close
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.audits.map((a: any) => (
                <div key={a.id} className="border rounded-lg p-2 text-sm">
                  <b>{a.action}</b> • {a.actorId}
                  <p>
                    {a.entityType}/{a.entityId}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
  function fee(key: string, field: string, value: number) {
    setData((old: any) => ({
      ...old,
      config: { ...old.config, [key]: { ...old.config[key], [field]: value } },
    }));
  }
  function discount(key: string, value: number) {
    setData((old: any) => ({
      ...old,
      config: {
        ...old.config,
        [key]: {
          ...old.config[key],
          discount: { ...old.config[key].discount, value },
        },
      },
    }));
  }
}
function Toggle({
  label,
  value,
  set,
}: {
  label: string;
  value: boolean;
  set: (v: boolean) => void;
}) {
  return (
    <div className="border rounded-lg p-3 flex justify-between">
      <Label>{label}</Label>
      <Switch checked={value} onCheckedChange={set} />
    </div>
  );
}
function Money({
  label,
  value,
  set,
}: {
  label: string;
  value: number;
  set: (v: number) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        type="number"
        min="0"
        value={value}
        onChange={(e) => set(Number(e.target.value))}
      />
    </div>
  );
}
function words(s: string) {
  return s.replace(/([A-Z])/g, " $1");
}
function MarriageForm({
  disabled,
  submit,
}: {
  disabled: boolean;
  submit: (ids: string[], method: string, meetingId: string) => void;
}) {
  const [a, setA] = useState(""),
    [b, setB] = useState(""),
    [meetingId, setMeetingId] = useState(""),
    [method, setMethod] = useState("Admin reviewed confirmation");
  return (
    <div className="grid md:grid-cols-2 gap-3">
      <Input
        placeholder="Customer A UID"
        value={a}
        onChange={(e) => setA(e.target.value)}
      />
      <Input
        placeholder="Customer B UID"
        value={b}
        onChange={(e) => setB(e.target.value)}
      />
      <Input
        placeholder="Completed meeting ID"
        value={meetingId}
        onChange={(e) => setMeetingId(e.target.value)}
      />
      <Input
        placeholder="Confirmation method"
        value={method}
        onChange={(e) => setMethod(e.target.value)}
      />
      <Button
        disabled={disabled || !a || !b || a === b || !meetingId}
        onClick={() => submit([a, b], method, meetingId)}
      >
        Confirm Marriage
      </Button>
    </div>
  );
}

function ServiceForm({
  disabled,
  submit,
}: {
  disabled: boolean;
  submit: (value: any) => void;
}) {
  const [value, setValue] = useState({
    name: "",
    description: "",
    sessionCount: 5,
    sessionDurationMinutes: 60,
    regularAmount: 3000,
    discount: 50,
  });
  return (
    <div className="space-y-3">
      <Input
        placeholder="Service name"
        value={value.name}
        onChange={(e) => setValue({ ...value, name: e.target.value })}
      />
      <Textarea
        placeholder="Description"
        value={value.description}
        onChange={(e) => setValue({ ...value, description: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-2">
        <Money
          label="Sessions"
          value={value.sessionCount}
          set={(v) => setValue({ ...value, sessionCount: v })}
        />
        <Money
          label="Minutes"
          value={value.sessionDurationMinutes}
          set={(v) => setValue({ ...value, sessionDurationMinutes: v })}
        />
        <Money
          label="Regular fee"
          value={value.regularAmount}
          set={(v) => setValue({ ...value, regularAmount: v })}
        />
        <Money
          label="Discount %"
          value={value.discount}
          set={(v) => setValue({ ...value, discount: v })}
        />
      </div>
      <Button
        disabled={disabled || !value.name}
        onClick={() =>
          submit({
            name: value.name,
            description: value.description,
            enabled: true,
            sortOrder: 99,
            sessionCount: value.sessionCount,
            sessionDurationMinutes: value.sessionDurationMinutes,
            topics: [],
            disclaimer:
              "Basic non-clinical guidance; not diagnosis, psychiatric treatment or emergency care.",
            fee: {
              enabled: true,
              regularAmount: value.regularAmount,
              discount: { type: "PERCENTAGE", value: value.discount },
              taxPercentage: 0,
              description: value.name,
            },
          })
        }
      >
        Add Service
      </Button>
    </div>
  );
}

function AvailabilityForm({
  disabled,
  submit,
}: {
  disabled: boolean;
  submit: (value: any) => void;
}) {
  const [date, setDate] = useState(""),
    [slots, setSlots] = useState("10:00, 11:00, 15:00");
  return (
    <div className="space-y-3">
      <Input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <Input value={slots} onChange={(e) => setSlots(e.target.value)} />
      <Button
        disabled={disabled || !date}
        onClick={() =>
          submit({
            date,
            slots: slots
              .split(",")
              .map((x) => x.trim())
              .filter((x) => /^([01]\d|2[0-3]):[0-5]\d$/.test(x)),
            blocked: false,
          })
        }
      >
        Save Slots
      </Button>
    </div>
  );
}

function ProfileFieldForm({
  disabled,
  submit,
}: {
  disabled: boolean;
  submit: (field: any) => void;
}) {
  const [field, setField] = useState({
    key: "",
    label: "",
    type: "TEXT",
    visibility: "MATCH",
    required: false,
    customerEditable: true,
    adminEditable: true,
    active: true,
    sortOrder: 99,
  });
  return (
    <div className="space-y-3">
      <Input
        placeholder="Stable key, e.g. motherTongue"
        value={field.key}
        onChange={(e) => setField({ ...field, key: e.target.value })}
      />
      <Input
        placeholder="Customer-facing label"
        value={field.label}
        onChange={(e) => setField({ ...field, label: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          className="h-10 rounded-md border bg-background px-3"
          value={field.type}
          onChange={(e) => setField({ ...field, type: e.target.value })}
        >
          {["TEXT", "TEXTAREA", "DATE", "SELECT", "EMAIL", "TEL"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select
          className="h-10 rounded-md border bg-background px-3"
          value={field.visibility}
          onChange={(e) => setField({ ...field, visibility: e.target.value })}
        >
          {["MATCH", "PROTECTED", "ADMIN_ONLY", "HIDDEN"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </div>
      <Toggle
        label="Required"
        value={field.required}
        set={(v) => setField({ ...field, required: v })}
      />
      <Button
        disabled={disabled || !field.key || !field.label}
        onClick={() => submit(field)}
      >
        Save Field
      </Button>
    </div>
  );
}

function MatrimonialCommissionSettings({
  disabled,
  policies,
  save,
  publish,
}: {
  disabled: boolean;
  policies: any[];
  save: (policy: any) => void;
  publish: (id: string) => void;
}) {
  const [policy, setPolicy] = useState<any>({
    ...defaultMatrimonialCommissionPolicy,
    effectiveFrom: new Date().toISOString().slice(0, 10),
  });
  function updateRule(event: "profileMeeting" | "marriageFixed", patch: any) {
    setPolicy({
      ...policy,
      [event]: { ...policy[event], ...patch },
    });
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin-Controlled Commission Rules</CardTitle>
        <CardDescription>
          No commission value is seeded automatically. Save a draft, review it,
          and publish the required version.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Input
          type="date"
          value={String(policy.effectiveFrom).slice(0, 10)}
          onChange={(event) =>
            setPolicy({ ...policy, effectiveFrom: event.target.value })
          }
        />
        {(
          [
            ["profileMeeting", "Profile Meeting Commission"],
            ["marriageFixed", "Marriage Fixed Commission"],
          ] as const
        ).map(([key, label]) => {
          const rule = policy[key];
          return (
            <div key={key} className="border rounded-lg p-4 space-y-3">
              <h3 className="font-bold">{label}</h3>
              <Toggle
                label="Enabled"
                value={rule.enabled}
                set={(value) => updateRule(key, { enabled: value })}
              />
              <select
                className="h-10 rounded-md border bg-background px-3 w-full"
                value={rule.type}
                onChange={(event) =>
                  updateRule(key, { type: event.target.value })
                }
              >
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED">Fixed Amount</option>
              </select>
              <div className="grid md:grid-cols-3 gap-3">
                <Money
                  label={
                    rule.type === "PERCENTAGE" ? "Percentage" : "Fixed amount"
                  }
                  value={rule.value}
                  set={(value) => updateRule(key, { value })}
                />
                <Money
                  label="Minimum qualifying payment"
                  value={rule.minimumQualifyingPayment}
                  set={(value) =>
                    updateRule(key, { minimumQualifyingPayment: value })
                  }
                />
                <Money
                  label="Maximum commission (0 = no cap)"
                  value={rule.maximumCommission || 0}
                  set={(value) =>
                    updateRule(key, {
                      maximumCommission: value > 0 ? value : null,
                    })
                  }
                />
              </div>
            </div>
          );
        })}
        <Button disabled={disabled} onClick={() => save(policy)}>
          Save New Draft Version
        </Button>
        <div className="space-y-2">
          {policies.map((item) => (
            <div
              key={item.id}
              className="border rounded-lg p-3 flex justify-between gap-3"
            >
              <span>
                Version {item.version} • {item.status}
              </span>
              {item.status === "DRAFT" && (
                <Button size="sm" onClick={() => publish(item.id)}>
                  Publish
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ReferralOverride({
  disabled,
  submit,
}: {
  disabled: boolean;
  submit: (value: any) => void;
}) {
  const [value, setValue] = useState({
    customerId: "",
    referralCode: "",
    reason: "",
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Correct Locked Referral</CardTitle>
        <CardDescription>
          Corrections are blocked after any commission has qualified.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-3 gap-3">
        <Input
          placeholder="Customer UID"
          value={value.customerId}
          onChange={(e) => setValue({ ...value, customerId: e.target.value })}
        />
        <Input
          placeholder="New IBA ID (blank for Direct)"
          value={value.referralCode}
          onChange={(e) =>
            setValue({ ...value, referralCode: e.target.value.toUpperCase() })
          }
        />
        <Input
          placeholder="Detailed correction reason"
          value={value.reason}
          onChange={(e) => setValue({ ...value, reason: e.target.value })}
        />
        <Button
          disabled={disabled || !value.customerId || value.reason.length < 10}
          onClick={() => submit(value)}
        >
          Apply Audited Correction
        </Button>
      </CardContent>
    </Card>
  );
}
