import { publicPageMetadata } from "@/lib/seo/public-page-metadata"
import { useTranslations as useUiCopy } from "next-intl"
import Link from "@/components/i18n/localized-link";

export function generateMetadata() {
  return publicPageMetadata("/privacy", "privacy")
}

export default function PrivacyPage() {
  const uiCopy = useUiCopy("publicCopy.privacy")

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link href="/" className="text-purple-400 hover:text-purple-300 mb-4 inline-block">{uiCopy("backToHome")}</Link>
          </div>

          <h1 className="text-5xl font-bold mb-4">{uiCopy("privacyPolicy")}</h1>
          <p className="text-slate-400 mb-8">{uiCopy("lastUpdatedFebruary82026")}</p>

          <div className="prose prose-invert prose-purple max-w-none">
            <div className="space-y-8">
              <section>
                <h2 className="text-3xl font-bold mb-4">{uiCopy("label1introduction")}</h2>
                <p className="text-slate-300 leading-relaxed">{uiCopy("atLibertureWeTakeYourPrivacySeriouslyThis")}</p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">{uiCopy("label2informationwecollect")}</h2>
                
                <h3 className="text-2xl font-semibold mt-6 mb-3">{uiCopy("label21informationyouprovide")}</h3>
                <ul className="list-disc pl-6 space-y-2 text-slate-300">
                  <li><strong>{uiCopy("accountInformation")}</strong> {uiCopy("nameEmailAddressPassword")}</li>
                  <li><strong>{uiCopy("profileData")}</strong> {uiCopy("bosLevelPreferencesGoals")}</li>
                  <li><strong>{uiCopy("communication")}</strong> {uiCopy("messagesSupportInquiriesFeedback")}</li>
                  <li><strong>{uiCopy("paymentInformation")}</strong> {uiCopy("processedSecurelyThroughThirdPartyPaymentProcessorsWe")}</li>
                </ul>

                <h3 className="text-2xl font-semibold mt-6 mb-3">{uiCopy("label22automaticallycollectedinformation")}</h3>
                <ul className="list-disc pl-6 space-y-2 text-slate-300">
                  <li><strong>{uiCopy("usageData")}</strong> {uiCopy("pagesViewedFeaturesUsedTimeSpentOnThe")}</li>
                  <li><strong>{uiCopy("deviceInformation")}</strong> {uiCopy("browserTypeOperatingSystemIpAddress")}</li>
                  <li><strong>{uiCopy("cookiesTracking")}</strong> {uiCopy("sessionCookiesAnalyticsCookiesPreferenceCookies")}</li>
                  <li><strong>{uiCopy("locationData")}</strong> {uiCopy("approximateGeographicLocationIfPermitted")}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">{uiCopy("label3howweuseyourinformation")}</h2>
                <p className="text-slate-300 leading-relaxed mb-4">{uiCopy("weUseTheCollectedInformationForTheFollowing")}</p>
                <ul className="list-disc pl-6 space-y-2 text-slate-300">
                  <li>{uiCopy("provideMaintainAndImproveThePlatform")}</li>
                  <li>{uiCopy("personalizeYourExperienceAndContentRecommendations")}</li>
                  <li>{uiCopy("processTransactionsAndSendRelatedInformation")}</li>
                  <li>{uiCopy("sendAdministrativeMessagesUpdatesAndSecurityAlerts")}</li>
                  <li>{uiCopy("respondToYourCommentsAndQuestions")}</li>
                  <li>{uiCopy("analyzeUsagePatternsToImproveOurServices")}</li>
                  <li>{uiCopy("detectAndPreventFraudAbuseOrSecurityIssues")}</li>
                  <li>{uiCopy("complyWithLegalObligations")}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">{uiCopy("label4cookiestrackingtechnologies")}</h2>
                <p className="text-slate-300 leading-relaxed mb-4">{uiCopy("weUseCookiesAndSimilarTrackingTechnologiesTo")}</p>
                <ul className="list-disc pl-6 space-y-2 text-slate-300">
                  <li><strong>{uiCopy("essentialCookies")}</strong> {uiCopy("requiredForThePlatformToFunctionAuthenticationSecurity")}</li>
                  <li><strong>{uiCopy("analyticsCookies")}</strong> {uiCopy("helpUsUnderstandHowUsersInteractWithThe")}</li>
                  <li><strong>{uiCopy("preferenceCookies")}</strong> {uiCopy("rememberYourSettingsAndPreferences")}</li>
                </ul>
                <p className="text-slate-300 leading-relaxed mt-4">{uiCopy("youCanControlCookiePreferencesThroughOurCookie")}</p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">5. Google Analytics</h2>
                <p className="text-slate-300 leading-relaxed mb-4">{uiCopy("weUseGoogleAnalyticsToAnalyzePlatformUsage")}</p>
                <ul className="list-disc pl-6 space-y-2 text-slate-300">
                  <li>{uiCopy("howOftenUsersVisitThePlatform")}</li>
                  <li>{uiCopy("whatPagesTheyVisitAndInWhatSequence")}</li>
                  <li>{uiCopy("howLongTheySpendOnEachPage")}</li>
                </ul>
                <p className="text-slate-300 leading-relaxed mt-4">{uiCopy("googleAnalyticsIs")} <strong>{uiCopy("disabledByDefault")}</strong>{uiCopy("itWillOnlyBeActivatedIfYouExplicitly")}{" "}
                  <Link href="/dashboard/settings" className="text-purple-400 hover:text-purple-300">{uiCopy("settingsPage")}</Link>.
                </p>
                <p className="text-slate-300 leading-relaxed mt-4">{uiCopy("learnMoreAboutGoogleSPrivacyPractices")}{" "}
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">{uiCopy("googlePrivacyPolicy")}</a>
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">{uiCopy("label6datasharingdisclosure")}</h2>
                <p className="text-slate-300 leading-relaxed mb-4">{uiCopy("weDoNotSellYourPersonalInformationWe")}</p>
                <ul className="list-disc pl-6 space-y-2 text-slate-300">
                  <li><strong>{uiCopy("serviceProviders")}</strong> {uiCopy("thirdPartiesThatHelpUsOperateThePlatform")}</li>
                  <li><strong>{uiCopy("legalRequirements")}</strong> {uiCopy("whenRequiredByLawOrToProtectOur")}</li>
                  <li><strong>{uiCopy("businessTransfers")}</strong> {uiCopy("inConnectionWithAMergerAcquisitionOrSale")}</li>
                  <li><strong>{uiCopy("withYourConsent")}</strong> {uiCopy("whenYouExplicitlyAuthorizeUsToShareInformation")}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">{uiCopy("label7datasecurity")}</h2>
                <p className="text-slate-300 leading-relaxed mb-4">{uiCopy("weImplementAppropriateTechnicalAndOrganizationalMeasuresTo")}</p>
                <ul className="list-disc pl-6 space-y-2 text-slate-300">
                  <li>{uiCopy("encryptionOfDataInTransitHttpsTls")}</li>
                  <li>{uiCopy("securePasswordHashingBcrypt")}</li>
                  <li>{uiCopy("regularSecurityAuditsAndUpdates")}</li>
                  <li>{uiCopy("accessControlsAndAuthenticationRequirements")}</li>
                </ul>
                <p className="text-slate-300 leading-relaxed mt-4">{uiCopy("howeverNoMethodOfTransmissionOverTheInternet")}</p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">{uiCopy("label8yourrightschoices")}</h2>
                <p className="text-slate-300 leading-relaxed mb-4">{uiCopy("youHaveTheFollowingRightsRegardingYourPersonal")}</p>
                <ul className="list-disc pl-6 space-y-2 text-slate-300">
                  <li><strong>{uiCopy("access")}</strong> {uiCopy("requestACopyOfYourPersonalData")}</li>
                  <li><strong>{uiCopy("correction")}</strong> {uiCopy("updateOrCorrectInaccurateInformation")}</li>
                  <li><strong>{uiCopy("deletion")}</strong> {uiCopy("requestDeletionOfYourAccountAndData")}</li>
                  <li><strong>{uiCopy("optOut")}</strong> {uiCopy("unsubscribeFromMarketingEmailsOrDisableAnalytics")}</li>
                  <li><strong>{uiCopy("dataPortability")}</strong> {uiCopy("receiveYourDataInAStructuredFormat")}</li>
                  <li><strong>{uiCopy("objection")}</strong> {uiCopy("objectToCertainDataProcessingActivities")}</li>
                </ul>
                <p className="text-slate-300 leading-relaxed mt-4">{uiCopy("toExerciseTheseRightsVisitYour")}{" "}
                  <Link href="/dashboard/settings" className="text-purple-400 hover:text-purple-300">{uiCopy("accountSettings")}</Link>{" "}{uiCopy("orContactUsDirectly")}</p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">{uiCopy("label9emailcommunications")}</h2>
                <p className="text-slate-300 leading-relaxed mb-4">{uiCopy("weMaySendYouDifferentTypesOfEmails")}</p>
                <ul className="list-disc pl-6 space-y-2 text-slate-300">
                  <li><strong>{uiCopy("transactional")}</strong> {uiCopy("accountNotificationsSecurityAlertsCannotBeDisabled")}</li>
                  <li><strong>Marketing:</strong> {uiCopy("productUpdatesNewFeaturesOptOutAnytime")}</li>
                  <li><strong>{uiCopy("weeklyDigest")}</strong> {uiCopy("curatedContentAndInsightsOptOutAnytime")}</li>
                </ul>
                <p className="text-slate-300 leading-relaxed mt-4">{uiCopy("manageYourEmailPreferencesIn")}{" "}
                  <Link href="/dashboard/settings" className="text-purple-400 hover:text-purple-300">{uiCopy("settings")}</Link>.
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">{uiCopy("label10childrensprivacy")}</h2>
                <p className="text-slate-300 leading-relaxed">{uiCopy("thePlatformIsNotIntendedForUsersUnder")}</p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">{uiCopy("label11internationaldatatransfers")}</h2>
                <p className="text-slate-300 leading-relaxed">{uiCopy("yourInformationMayBeTransferredToAndProcessed")}</p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">{uiCopy("label12dataretention")}</h2>
                <p className="text-slate-300 leading-relaxed">{uiCopy("weRetainYourPersonalInformationForAsLong")}</p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">{uiCopy("label13changestothispolicy")}</h2>
                <p className="text-slate-300 leading-relaxed">{uiCopy("weMayUpdateThisPrivacyPolicyFromTime")}</p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">{uiCopy("label14contactus")}</h2>
                <p className="text-slate-300 leading-relaxed">{uiCopy("ifYouHaveQuestionsAboutThisPrivacyPolicy")}{" "}
                  <Link href="/contact" className="text-purple-400 hover:text-purple-300">{uiCopy("contactForm")}</Link>
                </p>
              </section>

              <section className="mt-12 p-6 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                <h3 className="text-xl font-bold mb-3">{uiCopy("quickSummary")}</h3>
                <ul className="list-disc pl-6 space-y-1 text-slate-300 text-sm">
                  <li>{uiCopy("weCollectOnlyNecessaryDataToProvideAnd")}</li>
                  <li>{uiCopy("googleAnalyticsIs")} <strong>{uiCopy("optInOnly")}</strong> {uiCopy("disabledByDefaultAlt")}</li>
                  <li>{uiCopy("weNeverSellYourPersonalInformation")}</li>
                  <li>{uiCopy("youHaveFullControlOverYourDataAnd")}</li>
                  <li>{uiCopy("weUseIndustryStandardSecurityMeasures")}</li>
                  <li>{uiCopy("youCanDeleteYourAccountAndDataAt")}</li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
