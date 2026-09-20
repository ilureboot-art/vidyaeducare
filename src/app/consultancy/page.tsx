"use client";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  HeartHandshake,
  Loader2,
  ShieldCheck,
  Wallet,
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PromotionShare } from "@/components/PromotionShare";

export default function ConsultancyPage() {
  const { user } = useAuth(),
    { toast } = useToast();
  const [catalog, setCatalog] = useState<any>(null),
    [data, setData] = useState<any>({}),
    [matches, setMatches] = useState<any[]>([]),
    [profile, setProfile] = useState<any>({}),
    [accepted, setAccepted] = useState<Record<string, boolean>>({}),
    [busy, setBusy] = useState(false),
    [booking, setBooking] = useState({ serviceId: "", startsAt: "" }),
    [hasIbaReferral, setHasIbaReferral] = useState(false),
    [referralCode, setReferralCode] = useState(""),
    [referralResult, setReferralResult] = useState<any>(null),
    [referralConfirmed, setReferralConfirmed] = useState(false),
    [complaint, setComplaint] = useState({
      category: "Other",
      description: "",
    }),
    [contacts, setContacts] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState("matrimonial");
  useEffect(() => {
    fetch("/api/consultancy/config")
      .then((r) => r.json())
      .then(setCatalog);
  }, []);
  useEffect(() => {
    if (!catalog) return;
    const serviceId = new URLSearchParams(window.location.search).get("service");
    if (serviceId === "matrimonial" && catalog.config.matrimonialEnabled) {
      setActiveTab("matrimonial");
    } else if (catalog.services.some((service: any) => service.id === serviceId)) {
      setActiveTab("counselling");
      setBooking((current) => ({ ...current, serviceId: serviceId! }));
    }
  }, [catalog]);
  useEffect(() => {
    if (user) load();
  }, [user]);
  async function api(method = "GET", body?: any, url = "/api/consultancy") {
    const token = await user!.getIdToken();
    const r = await fetch(url, {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const d = await r.json();
    if (!r.ok)
      throw new Error(
        d.error + (d.required ? ` Add ₹${d.required} to wallet.` : ""),
      );
    return d;
  }
  async function load() {
    try {
      const [d, m] = await Promise.all([
        api(),
        api("GET", undefined, "/api/consultancy?view=matches"),
      ]);
      setData(d);
      setProfile(d.profile || {});
      setMatches(m.matches || []);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Unable to load",
        description: e instanceof Error ? e.message : "Request failed",
      });
    }
  }
  async function act(body: any, message: string) {
    setBusy(true);
    try {
      await api("POST", body);
      toast({ title: message });
      await load();
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
  async function revealContact(meetingId: string) {
    try {
      const result = await api(
        "GET",
        undefined,
        `/api/consultancy?view=contact&meetingId=${encodeURIComponent(meetingId)}`,
      );
      setContacts({ ...contacts, [meetingId]: result.contact });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Contact unavailable",
        description: e instanceof Error ? e.message : "Request failed",
      });
    }
  }
  async function validateReferral() {
    setBusy(true);
    try {
      const result = await api(
        "GET",
        undefined,
        `/api/consultancy?view=validateReferral&code=${encodeURIComponent(referralCode.trim())}`,
      );
      setReferralResult(result);
      setReferralConfirmed(false);
      toast({
        title: result.valid
          ? "Referral ID verified"
          : "IBA ID is invalid or ineligible",
      });
    } finally {
      setBusy(false);
    }
  }
  if (!catalog)
    return (
      <div className="p-10">
        <Loader2 className="animate-spin" />
      </div>
    );
  const docs = catalog.documents || [],
    required = [
      "MATRIMONIAL_SERVICE_AGREEMENT",
      "SUCCESS_FEE_UNDERTAKING",
      "PRIVACY_NOTICE",
      "CODE_OF_CONDUCT",
    ],
    requiredDocs = required
      .map((type) => docs.find((d: any) => d.type === type))
      .filter(Boolean);
  const registered = data.entitlement?.status === "ACTIVE";
  const counsellingDocs = [
    "COUNSELLING_SERVICE_AGREEMENT",
    "COUNSELLING_DISCLAIMER",
    "PRIVACY_NOTICE",
    "COUNSELLING_CODE_OF_CONDUCT",
  ]
    .map((type) => docs.find((d: any) => d.type === type))
    .filter(Boolean);
  return (
    <main className="mx-auto max-w-7xl p-4 md:p-8 space-y-6">
      <header>
        <h1 className="text-3xl md:text-5xl font-black flex gap-3">
          <HeartHandshake className="text-primary" />
          {catalog.config.title}
        </h1>
        <p className="text-muted-foreground mt-2">
          Matrimonial Bureau and counselling are independent services.
          Counselling disclosures are never used for matching.
        </p>
      </header>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="matrimonial">Matrimonial</TabsTrigger>
          <TabsTrigger value="counselling">Counselling</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
        </TabsList>
        <TabsContent value="matrimonial" className="space-y-5">
          {catalog.config.matrimonialEnabled && (
            <PromotionShare
              title="Vidya Educare Matrimonial Bureau"
              description="Explore registration, profile matching and mutually agreed profile meetings. Fees and terms are shown on the service page."
              path="/consultancy?service=matrimonial"
            />
          )}
          {!catalog.config.matrimonialEnabled && (
            <Card>
              <CardHeader>
                <CardTitle>Matrimonial Bureau is currently inactive</CardTitle>
                <CardDescription>
                  New registration, profile matching, interests and meeting
                  payments are temporarily unavailable. Existing records remain
                  protected.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
          {!registered && (
            <Card>
              <CardHeader>
                <CardTitle>Matrimonial Registration</CardTitle>
                <CardDescription>
                  Review and affirmatively accept every current document before
                  paying.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Price p={catalog.config.registrationPricing} />
                <div className="border rounded-lg p-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={hasIbaReferral}
                      onCheckedChange={(value) => {
                        setHasIbaReferral(value === true);
                        setReferralResult(null);
                        setReferralConfirmed(false);
                      }}
                    />
                    <span>Were you referred by a Vidya Educare IBA?</span>
                  </div>
                  {hasIbaReferral && (
                    <>
                      <div className="flex gap-2">
                        <Input
                          placeholder="IBA ID / Referral Code"
                          value={referralCode}
                          onChange={(event) => {
                            setReferralCode(event.target.value.toUpperCase());
                            setReferralResult(null);
                            setReferralConfirmed(false);
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          disabled={busy || !referralCode.trim()}
                          onClick={validateReferral}
                        >
                          Verify
                        </Button>
                      </div>
                      {referralResult?.valid && (
                        <div className="space-y-2">
                          <p className="text-sm font-bold text-green-700">
                            Referral ID verified
                            {referralResult.displayName
                              ? ` — ${referralResult.displayName}`
                              : ""}
                          </p>
                          <div className="flex gap-2">
                            <Checkbox
                              checked={referralConfirmed}
                              onCheckedChange={(value) =>
                                setReferralConfirmed(value === true)
                              }
                            />
                            <span className="text-sm">
                              I confirm that I was referred by this IBA. The IBA
                              is only the referral source and cannot control my
                              matrimonial profile or decisions.
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
                {requiredDocs.length < 4 && (
                  <p className="text-destructive font-bold">
                    Admin must publish all required agreements before
                    registration can begin.
                  </p>
                )}
                {requiredDocs.map((d: any) => (
                  <div key={d.id} className="border rounded-lg p-3">
                    <p className="font-bold">
                      {d.title} — Version {d.version}
                    </p>
                    <div className="max-h-36 overflow-auto whitespace-pre-wrap text-sm my-2">
                      {d.content}
                    </div>
                    <div className="flex gap-2">
                      <Checkbox
                        checked={accepted[d.id] || false}
                        onCheckedChange={(v) =>
                          setAccepted({ ...accepted, [d.id]: v === true })
                        }
                      />
                      <span className="text-sm">
                        I have read and affirmatively accept this version.
                      </span>
                    </div>
                  </div>
                ))}
                <Button
                  disabled={
                    busy ||
                    !catalog.config.matrimonialEnabled ||
                    requiredDocs.length < 4 ||
                    requiredDocs.some((d: any) => !accepted[d.id]) ||
                    (hasIbaReferral &&
                      (!referralResult?.valid || !referralConfirmed))
                  }
                  onClick={() =>
                    act(
                      {
                        action: "REGISTER_MATRIMONIAL",
                        acceptedDocumentVersionIds: requiredDocs.map(
                          (d: any) => d.id,
                        ),
                        idempotencyKey: crypto.randomUUID().replaceAll("-", ""),
                        referralCode: hasIbaReferral ? referralCode.trim() : "",
                        referralConfirmed: hasIbaReferral && referralConfirmed,
                      },
                      "Registration payment completed",
                    )
                  }
                >
                  <Wallet /> Pay ₹
                  {catalog.config.registrationPricing.payableAmount} & Register
                </Button>
              </CardContent>
            </Card>
          )}
          {registered && (
            <>
              {data.referralAttribution && (
                <Card>
                  <CardContent className="pt-5 text-sm">
                    Matrimonial referral:{" "}
                    {data.referralAttribution.referralCode ||
                      "Direct registration"}{" "}
                    • {data.referralAttribution.attributionStatus}
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardHeader>
                  <CardTitle>My Matrimonial Profile</CardTitle>
                  <CardDescription>
                    Protected contact information never appears in match
                    results.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  {catalog.profileFields.map((f: any) => (
                    <div
                      key={f.key}
                      className={
                        f.type === "TEXTAREA"
                          ? "md:col-span-2 space-y-2"
                          : "space-y-2"
                      }
                    >
                      <Label>
                        {f.label}
                        {f.required ? " *" : ""}
                        {f.visibility === "PROTECTED" && (
                          <Badge variant="outline" className="ml-2">
                            Protected
                          </Badge>
                        )}
                      </Label>
                      {f.type === "TEXTAREA" ? (
                        <Textarea
                          value={profile[f.key] || ""}
                          onChange={(e) =>
                            setProfile({ ...profile, [f.key]: e.target.value })
                          }
                        />
                      ) : f.type === "SELECT" && f.options?.length ? (
                        <Select
                          value={profile[f.key] || ""}
                          onValueChange={(value) =>
                            setProfile({ ...profile, [f.key]: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`Select ${f.label}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {f.options.map((option: string) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          type={
                            f.type === "DATE"
                              ? "date"
                              : f.type === "EMAIL"
                                ? "email"
                                : f.type === "TEL"
                                  ? "tel"
                                  : "text"
                          }
                          value={profile[f.key] || ""}
                          onChange={(e) =>
                            setProfile({ ...profile, [f.key]: e.target.value })
                          }
                        />
                      )}
                    </div>
                  ))}
                  <div className="md:col-span-2 flex gap-3">
                    <Button
                      disabled={busy}
                      onClick={() =>
                        act(
                          { action: "SAVE_PROFILE", profile },
                          "Profile saved",
                        )
                      }
                    >
                      <ShieldCheck /> Save Profile
                    </Button>
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        act(
                          {
                            action: "SUBMIT_VERIFICATION",
                            documentReferences: [],
                          },
                          "Verification submitted",
                        )
                      }
                    >
                      Submit Verification
                    </Button>
                  </div>
                  <p className="md:col-span-2 text-sm">
                    Verification:{" "}
                    <Badge>{data.verification?.status || "PENDING"}</Badge>
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Matches</CardTitle>
                  <CardDescription>
                    Only matching fields are shown. No phone, email or address
                    is included.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-3">
                  {matches.length ? (
                    matches.map((m: any) => (
                      <div key={m.id} className="border rounded-lg p-4">
                        <p className="font-bold text-lg">
                          {m.displayName || "Candidate"}
                        </p>
                        {Object.entries(m)
                          .filter(
                            ([k]) =>
                              ![
                                "id",
                                "userId",
                                "displayName",
                                "status",
                                "verificationBadges",
                                "createdAt",
                              ].includes(k),
                          )
                          .map(([k, v]) => (
                            <p className="text-sm" key={k}>
                              <b>{k}:</b> {String(v)}
                            </p>
                          ))}
                        <Button
                          className="mt-3"
                          size="sm"
                          onClick={() =>
                            act(
                              {
                                action: "EXPRESS_INTEREST",
                                targetUserId: m.id,
                              },
                              "Interest sent",
                            )
                          }
                        >
                          Express Interest
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">
                      No active matches available.
                    </p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Interests</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(data.incomingInterests || []).map((i: any) => (
                    <div key={i.id} className="border rounded-lg p-3">
                      <p>
                        Incoming interest — <Badge>{i.status}</Badge>
                      </p>
                      {i.status === "PENDING" && (
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              act(
                                {
                                  action: "RESPOND_INTEREST",
                                  interestId: i.id,
                                  response: "ACCEPTED",
                                },
                                "Interest accepted",
                              )
                            }
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              act(
                                {
                                  action: "RESPOND_INTEREST",
                                  interestId: i.id,
                                  response: "REJECTED",
                                },
                                "Interest declined",
                              )
                            }
                          >
                            Decline
                          </Button>
                        </div>
                      )}
                      {i.status === "ACCEPTED" && (
                        <Button
                          className="mt-2"
                          size="sm"
                          onClick={() =>
                            act(
                              {
                                action: "REQUEST_MEETING",
                                targetUserId: i.fromUserId,
                                requestId: crypto
                                  .randomUUID()
                                  .replaceAll("-", ""),
                              },
                              "Meeting requested",
                            )
                          }
                        >
                          Request Meeting
                        </Button>
                      )}
                    </div>
                  ))}
                  {(data.outgoingInterests || [])
                    .filter((i: any) => i.status === "ACCEPTED")
                    .map((i: any) => (
                      <div key={i.id} className="border rounded-lg p-3">
                        <p>Mutual interest confirmed</p>
                        <Button
                          className="mt-2"
                          size="sm"
                          onClick={() =>
                            act(
                              {
                                action: "REQUEST_MEETING",
                                targetUserId: i.toUserId,
                                requestId: crypto
                                  .randomUUID()
                                  .replaceAll("-", ""),
                              },
                              "Meeting requested",
                            )
                          }
                        >
                          Request Meeting
                        </Button>
                      </div>
                    ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Meetings & Contact Sharing</CardTitle>
                  <CardDescription>
                    Both customers pay separately. Mutual consent never
                    automatically reveals contact details.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(data.meetings || []).map((m: any) => (
                    <div key={m.id} className="border rounded-lg p-3">
                      <p>
                        <b>Status:</b> {m.status}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Meeting {m.id}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {m.status === "CONSENT_PENDING" &&
                          !m.participantConsents?.[user!.uid] && (
                            <Button
                              size="sm"
                              onClick={() =>
                                act(
                                  {
                                    action: "CONSENT_MEETING",
                                    meetingId: m.id,
                                    consent: true,
                                  },
                                  "Meeting consent recorded",
                                )
                              }
                            >
                              Consent
                            </Button>
                          )}
                        {m.status === "PAYMENT_PENDING" &&
                          !m.participantPayments?.[user!.uid] && (
                            <Button
                              size="sm"
                              onClick={() =>
                                act(
                                  {
                                    action: "PAY_MEETING",
                                    meetingId: m.id,
                                    idempotencyKey: crypto
                                      .randomUUID()
                                      .replaceAll("-", ""),
                                  },
                                  "Independent meeting fee paid",
                                )
                              }
                            >
                              Pay ₹{catalog.config.meetingPricing.payableAmount}
                            </Button>
                          )}
                        {[
                          "CONTACT_APPROVED",
                          "CONFIRMED",
                          "COMPLETED",
                        ].includes(m.status) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => revealContact(m.id)}
                          >
                            View Approved Contact
                          </Button>
                        )}
                      </div>
                      {contacts[m.id] && (
                        <div className="mt-2 text-sm rounded bg-muted p-2">
                          {Object.entries(contacts[m.id]).map(([k, v]) => (
                            <p key={k}>
                              <b>{k}:</b> {String(v)}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Success Fee Obligations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(data.successFeeObligations || []).map((o: any) => (
                    <div key={o.id} className="border rounded-lg p-3">
                      <p className="font-bold">
                        ₹{o.payableAmount} — {o.status}
                      </p>
                      {["DUE", "OUTSTANDING", "PARTIALLY_PAID"].includes(
                        o.status,
                      ) && (
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              act(
                                {
                                  action: "PAY_SUCCESS_FEE",
                                  obligationId: o.id,
                                  idempotencyKey: crypto
                                    .randomUUID()
                                    .replaceAll("-", ""),
                                },
                                "Success Fee paid",
                              )
                            }
                          >
                            Pay Now
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              act(
                                {
                                  action: "DISPUTE_SUCCESS_FEE",
                                  obligationId: o.id,
                                  reason: "Customer requested Admin review",
                                },
                                "Dispute submitted for review",
                              )
                            }
                          >
                            Raise Dispute
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
        <TabsContent value="counselling" className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            {catalog.services.map((s: any) => (
              <Card key={s.id}>
                <CardHeader>
                  <CardTitle>{s.name}</CardTitle>
                  <CardDescription>{s.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Price p={s.pricing} />
                  <p className="text-sm">
                    {s.sessionCount} sessions • {s.sessionDurationMinutes}{" "}
                    minutes
                  </p>
                  {s.disclaimer && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {s.disclaimer}
                    </p>
                  )}
                  <div className="mt-3">
                    <PromotionShare
                      title={`Vidya Educare – ${s.name}`}
                      description={`${s.description} View current fees, terms and booking availability online.`}
                      path={`/consultancy?service=${encodeURIComponent(s.id)}`}
                    />
                  </div>
                  <Button
                    className="mt-3"
                    variant={booking.serviceId === s.id ? "default" : "outline"}
                    onClick={() => setBooking({ ...booking, serviceId: s.id })}
                  >
                    Select
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle>
                <CalendarDays className="inline mr-2" />
                Book Counselling
              </CardTitle>
              <CardDescription>
                Available slots are confirmed transactionally to prevent double
                booking.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {counsellingDocs.length < 4 && (
                <p className="text-destructive font-bold">
                  Admin must publish all required counselling documents before
                  booking.
                </p>
              )}
              {counsellingDocs.map((d: any) => (
                <div key={d.id} className="border rounded-lg p-3">
                  <p className="font-bold">
                    {d.title} — Version {d.version}
                  </p>
                  <div className="max-h-28 overflow-auto whitespace-pre-wrap text-sm my-2">
                    {d.content}
                  </div>
                  <div className="flex gap-2">
                    <Checkbox
                      checked={accepted[d.id] || false}
                      onCheckedChange={(v) =>
                        setAccepted({ ...accepted, [d.id]: v === true })
                      }
                    />
                    <span className="text-sm">
                      I have read and affirmatively accept this version.
                    </span>
                  </div>
                </div>
              ))}
              <Input
                type="datetime-local"
                value={booking.startsAt}
                onChange={(e) =>
                  setBooking({ ...booking, startsAt: e.target.value })
                }
              />
              <div className="flex flex-wrap gap-2">
                {(catalog.availability || []).flatMap((a: any) =>
                  a.slots.map((time: string) => (
                    <Button
                      key={`${a.date}-${time}`}
                      type="button"
                      size="sm"
                      variant={
                        booking.startsAt === `${a.date}T${time}`
                          ? "default"
                          : "outline"
                      }
                      onClick={() =>
                        setBooking({
                          ...booking,
                          startsAt: `${a.date}T${time}`,
                        })
                      }
                    >
                      {a.date} • {time}
                    </Button>
                  )),
                )}
              </div>
              <Button
                disabled={
                  busy ||
                  !booking.serviceId ||
                  !booking.startsAt ||
                  counsellingDocs.length < 4 ||
                  counsellingDocs.some((d: any) => !accepted[d.id])
                }
                onClick={() =>
                  act(
                    {
                      action: "BOOK_COUNSELLING",
                      ...booking,
                      startsAt: indiaLocalToIso(booking.startsAt),
                      acceptedDocumentVersionIds: counsellingDocs.map(
                        (d: any) => d.id,
                      ),
                      idempotencyKey: crypto.randomUUID().replaceAll("-", ""),
                    },
                    "Counselling booked",
                  )
                }
              >
                Pay Advance & Confirm
              </Button>
              {(data.bookings || []).map((b: any) => (
                <div key={b.id} className="border rounded-lg p-3">
                  <b>{b.serviceName}</b>
                  <p>
                    {b.status} • Advance ₹{b.advancePaid} • Balance ₹
                    {b.balanceDue}
                  </p>
                  {Number(b.balanceDue || 0) > 0 &&
                    ["CONFIRMED", "RESCHEDULED"].includes(b.status) && (
                      <Button
                        className="mt-2"
                        size="sm"
                        disabled={busy}
                        onClick={() =>
                          act(
                            {
                              action: "PAY_COUNSELLING_BALANCE",
                              bookingId: b.id,
                              idempotencyKey: crypto
                                .randomUUID()
                                .replaceAll("-", ""),
                            },
                            "Counselling balance paid",
                          )
                        }
                      >
                        Pay Balance ₹{b.balanceDue}
                      </Button>
                    )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="support">
          <Card>
            <CardHeader>
              <CardTitle>Report Concern</CardTitle>
              <CardDescription>
                A report does not automatically establish guilt. Admin follows a
                fair review process.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select
                value={complaint.category}
                onValueChange={(v) =>
                  setComplaint({ ...complaint, category: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {catalog.config.complaintCategories.map((x: string) => (
                    <SelectItem value={x} key={x}>
                      {x}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Describe the concern"
                value={complaint.description}
                onChange={(e) =>
                  setComplaint({ ...complaint, description: e.target.value })
                }
              />
              <Button
                disabled={busy || !complaint.description.trim()}
                onClick={() =>
                  act(
                    { action: "REPORT_CONCERN", ...complaint },
                    "Concern submitted",
                  )
                }
              >
                Submit Report
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
function Price({ p }: { p: any }) {
  return (
    <div className="flex gap-3 items-end my-2">
      <span className="line-through text-muted-foreground">
        ₹{p.regularAmount}
      </span>
      <span className="font-black text-2xl">₹{p.payableAmount}</span>
      {p.discountAmount > 0 && <Badge>Save ₹{p.discountAmount}</Badge>}
    </div>
  );
}

function indiaLocalToIso(value: string) {
  return new Date(
    `${value.length === 16 ? value + ":00" : value}+05:30`,
  ).toISOString();
}
