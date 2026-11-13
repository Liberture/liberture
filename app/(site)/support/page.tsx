import { publicPageMetadata } from "@/lib/seo/public-page-metadata"
import { getLocale, getTranslations as getUiCopy } from "next-intl/server"
import Link from "@/components/i18n/localized-link"

import { LegalPage } from "@/components/habits/site/legal-page"
import { getSiteSetting } from "@/lib/habits/oauth/store"
import { getSiteMessages } from "@/lib/i18n/messages.server"

export function generateMetadata() {
  return publicPageMetadata("/support", "support")
}

export default async function SupportPage() {
  const uiCopy = await getUiCopy("publicCopy.support")

  const [email, locale] = await Promise.all([getSiteSetting("contact_email").catch(() => null), getLocale()])
  const dict = (await getSiteMessages()).habits
  return (
    <LegalPage locale={locale} dict={dict} title={uiCopy("support")}>
      <p>
        {email ? (
          <>{uiCopy("writeTo")} <a href={`mailto:${email}`}>{email}</a>{uiCopy("weUsuallyAnswerWithinTwoWorkingDays")}</>
        ) : (
          <>{uiCopy("contactDetailsAreBeingSetUpInThe")}</>
        )}
      </p>

      <h2>{uiCopy("settingUp")}</h2>
      <ul>
        <li><Link href="/docs">{uiCopy("overview")}</Link>{uiCopy("whatYourAssistantCanDo")}</li>
        <li><Link href="/docs/claude">{uiCopy("connectClaude")}</Link> {uiCopy("and")} <Link href="/docs/chatgpt">{uiCopy("connectChatgpt")}</Link>.</li>
        <li><Link href="/docs/permissions">{uiCopy("permissions")}</Link>{uiCopy("whatEachSwitchAllows")}</li>
      </ul>

      <h2>{uiCopy("commonProblems")}</h2>
      <ul>
        <li><strong>{uiCopy("theAssistantAsksMeToSignInAgain")}</strong> {uiCopy("itWasDisconnectedInSettingsOrYouUsed")}</li>
        <li><strong>{uiCopy("itSaysAnActionIsSwitchedOff")}</strong> {uiCopy("turnItBackOnInSettingsVoiceAssistants")}</li>
        <li><strong>{uiCopy("itCanTFindAHabit")}</strong> {uiCopy("sayTheNameAsItAppearsInThe")}</li>
        <li><strong>{uiCopy("iWantToDeleteMyData")}</strong> {uiCopy("useSettingsClearAllDataOrWriteTo")}</li>
      </ul>
    </LegalPage>
  )
}
