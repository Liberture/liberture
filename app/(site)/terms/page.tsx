import { publicPageMetadata } from "@/lib/seo/public-page-metadata"
import { useTranslations as useUiCopy } from "next-intl"
import Link from "@/components/i18n/localized-link";

export function generateMetadata() {
  return publicPageMetadata("/terms", "terms")
}

export default function TermsPage() {
  const uiCopy = useUiCopy("publicCopy.terms")

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link href="/" className="text-purple-400 hover:text-purple-300 mb-4 inline-block">{uiCopy("backToHome")}</Link>
          </div>

          <h1 className="text-5xl font-bold mb-4">{uiCopy("termsConditions")}</h1>
          <p className="text-slate-400 mb-8">{uiCopy("lastUpdatedFebruary82026")}</p>

          <div className="prose prose-invert prose-purple max-w-none">
            <div className="space-y-8">
              <section>
                <h2 className="text-3xl font-bold mb-4">{uiCopy("label1acceptanceofterms")}</h2>
                <p className="text-slate-300 leading-relaxed">{uiCopy("byAccessingAndUsingLibertureThePlatformYou")}</p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">{uiCopy("label2useoftheplatform")}</h2>
                <p className="text-slate-300 leading-relaxed mb-4">{uiCopy("libertureProvidesABiologicalOptimizationPlatformThatAggregates")}</p>
                <ul className="list-disc pl-6 space-y-2 text-slate-300">
                  <li>{uiCopy("useThePlatformOnlyForLawfulPurposes")}</li>
                  <li>{uiCopy("notAttemptToGainUnauthorizedAccessToAny")}</li>
                  <li>{uiCopy("notUseThePlatformToDistributeMalwareOr")}</li>
                  <li>{uiCopy("notImpersonateAnyPersonOrEntity")}</li>
                  <li>{uiCopy("respectIntellectualPropertyRightsOfContentCreators")}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">{uiCopy("label3healthmedicaldisclaimer")}</h2>
                <p className="text-slate-300 leading-relaxed mb-4">
                  <strong className="text-yellow-400">{uiCopy("important")}</strong> {uiCopy("theInformationProvidedOnLibertureIsForEducational")}</p>
                <ul className="list-disc pl-6 space-y-2 text-slate-300">
                  <li>{uiCopy("alwaysConsultWithAQualifiedHealthcareProfessionalBefore")}</li>
                  <li>{uiCopy("individualResultsMayVarySignificantly")}</li>
                  <li>{uiCopy("weDoNotDiagnoseTreatCureOrPrevent")}</li>
                  <li>{uiCopy("youAssumeFullResponsibilityForAnyActionsTaken")}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">{uiCopy("label4useraccounts")}</h2>
                <p className="text-slate-300 leading-relaxed mb-4">{uiCopy("whenYouCreateAnAccountWithUsYou")}</p>
                <ul className="list-disc pl-6 space-y-2 text-slate-300">
                  <li>{uiCopy("maintainingTheSecurityOfYourAccountCredentials")}</li>
                  <li>{uiCopy("allActivitiesThatOccurUnderYourAccount")}</li>
                  <li>{uiCopy("notifyingUsImmediatelyOfAnyUnauthorizedAccess")}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">{uiCopy("label5contentintellectualproperty")}</h2>
                <p className="text-slate-300 leading-relaxed mb-4">{uiCopy("thePlatformAndItsOriginalContentExcludingUser")}</p>
                <p className="text-slate-300 leading-relaxed">{uiCopy("thirdPartyContentBooksProtocolsArticlesLinkedOr")}</p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">{uiCopy("label6premiumcontentservices")}</h2>
                <p className="text-slate-300 leading-relaxed mb-4">{uiCopy("someFeaturesProtocolsOrContentOnThePlatform")}</p>
                <ul className="list-disc pl-6 space-y-2 text-slate-300">
                  <li>{uiCopy("paymentTermsAreSpecifiedAtTheTimeOf")}</li>
                  <li>{uiCopy("refundPoliciesAreProvidedForEachProductOr")}</li>
                  <li>{uiCopy("weReserveTheRightToModifyPricingWith")}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">{uiCopy("label7thirdpartylinks")}</h2>
                <p className="text-slate-300 leading-relaxed">{uiCopy("thePlatformMayContainLinksToThirdParty")}</p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">{uiCopy("label8limitationofliability")}</h2>
                <p className="text-slate-300 leading-relaxed mb-4">{uiCopy("toTheMaximumExtentPermittedByLawLiberture")}</p>
                <ul className="list-disc pl-6 space-y-2 text-slate-300">
                  <li>{uiCopy("anyInjuriesHealthIssuesOrAdverseEffectsResulting")}</li>
                  <li>{uiCopy("indirectIncidentalOrConsequentialDamages")}</li>
                  <li>{uiCopy("lossOfDataRevenueOrProfits")}</li>
                  <li>{uiCopy("serviceInterruptionsOrTechnicalIssues")}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">{uiCopy("label9indemnification")}</h2>
                <p className="text-slate-300 leading-relaxed">{uiCopy("youAgreeToIndemnifyAndHoldHarmlessLiberture")}</p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">{uiCopy("label10changestoterms")}</h2>
                <p className="text-slate-300 leading-relaxed">{uiCopy("weReserveTheRightToModifyTheseTerms")}</p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">{uiCopy("label11termination")}</h2>
                <p className="text-slate-300 leading-relaxed">{uiCopy("weMayTerminateOrSuspendYourAccountAnd")}</p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">{uiCopy("label12governinglaw")}</h2>
                <p className="text-slate-300 leading-relaxed">{uiCopy("theseTermsShallBeGovernedByAndConstrued")}</p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">{uiCopy("label13contact")}</h2>
                <p className="text-slate-300 leading-relaxed">{uiCopy("ifYouHaveQuestionsAboutTheseTermsPlease")}{" "}
                  <Link href="/contact" className="text-purple-400 hover:text-purple-300">{uiCopy("contactForm")}</Link>
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
