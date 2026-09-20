import { NextResponse } from "next/server";
import { adminDb } from "@/firebase/admin-init";
import {
  calculateFee,
  CONSULTANCY_CONFIG_ID,
  ConsultancyConfig,
  defaultConsultancyConfig,
  defaultProfileFields,
} from "@/lib/consultancy";

export const dynamic = "force-dynamic";
export async function GET() {
  const [
    configSnap,
    fieldsSnap,
    servicesSnap,
    documentsSnap,
    availabilitySnap,
  ] = await Promise.all([
    adminDb.collection("configs").doc(CONSULTANCY_CONFIG_ID).get(),
    adminDb
      .collection("consultancyProfileFields")
      .where("active", "==", true)
      .get(),
    adminDb
      .collection("counsellingServices")
      .where("enabled", "==", true)
      .get(),
    adminDb
      .collection("consultancyDocumentVersions")
      .where("status", "==", "PUBLISHED")
      .get(),
    adminDb.collection("counsellingAvailability").get(),
  ]);
  const config = configSnap.exists
    ? ({
        ...defaultConsultancyConfig,
        ...configSnap.data(),
      } as ConsultancyConfig)
    : defaultConsultancyConfig;
  const publicFields = (
    fieldsSnap.empty
      ? defaultProfileFields
      : fieldsSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
  ).filter(
    (f: any) => f.visibility !== "ADMIN_ONLY" && f.visibility !== "HIDDEN",
  );
  const services = servicesSnap.docs
    .map((d) => {
      const data: any = d.data();
      return {
        id: d.id,
        name: data.name,
        description: data.description,
        sessionCount: data.sessionCount,
        sessionDurationMinutes: data.sessionDurationMinutes,
        topics: data.topics || [],
        disclaimer: data.disclaimer || "",
        sortOrder: Number(data.sortOrder || 0),
        pricing: calculateFee(data.fee),
        advancePercentage:
          data.advancePercentage ?? config.counsellingAdvancePercentage,
      };
    })
    .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));
  const documents = documentsSnap.docs.map((d) => {
    const x: any = d.data();
    return {
      id: d.id,
      documentId: x.documentId,
      type: x.type,
      title: x.title,
      version: x.version,
      content: x.content,
      effectiveFrom: x.effectiveFrom,
      status: x.status,
      legalReviewNotice: x.legalReviewNotice || null,
    };
  });
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());
  const availability = availabilitySnap.docs
    .filter((d) => d.id >= today && d.data().blocked !== true)
    .map((d) => ({ date: d.id, slots: d.data().slots || [] }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 60);
  return NextResponse.json({
    config: {
      ...config,
      registrationPricing: calculateFee(config.registrationFee),
      meetingPricing: calculateFee(config.meetingFee),
      successPricing: calculateFee(config.successFee),
    },
    profileFields: publicFields,
    services,
    documents,
    availability,
  });
}
