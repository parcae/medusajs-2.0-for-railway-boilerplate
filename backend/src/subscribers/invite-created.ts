import { INotificationModuleService, IUserModuleService } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { BACKEND_URL, SENDGRID_API_KEY, SENDGRID_INVITE_USER_TEMPLATE_ID } from '../lib/constants'
import { EmailTemplates } from '../modules/email-notifications/templates'

export default async function userInviteHandler({
    event: { data },
    container,
  }: SubscriberArgs<any>) {

  const notificationModuleService: INotificationModuleService = container.resolve(
    Modules.NOTIFICATION,
  )
  const userModuleService: IUserModuleService = container.resolve(Modules.USER)
  const invite = await userModuleService.retrieveInvite(data.id)

  // SendGrid resolves `template` as a Dynamic Template ID from its own dashboard,
  // while Resend resolves it against the React templates in ../modules/email-notifications.
  if (SENDGRID_API_KEY && !SENDGRID_INVITE_USER_TEMPLATE_ID) {
    console.error('SENDGRID_INVITE_USER_TEMPLATE_ID is not set - skipping invite email')
    return
  }
  const template = SENDGRID_API_KEY ? SENDGRID_INVITE_USER_TEMPLATE_ID! : EmailTemplates.INVITE_USER

  try {
    await notificationModuleService.createNotifications({
      to: invite.email,
      channel: 'email',
      template,
      data: {
        emailOptions: {
          replyTo: 'info@example.com',
          subject: "You've been invited to Medusa!"
        },
        inviteLink: `${BACKEND_URL}/app/invite?token=${invite.token}`,
        preview: 'The administration dashboard awaits...'
      }
    })
  } catch (error) {
    console.error(error)
  }
}

export const config: SubscriberConfig = {
  event: ['invite.created', 'invite.resent']
}
