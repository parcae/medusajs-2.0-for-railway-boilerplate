import { Modules } from '@medusajs/framework/utils'
import { INotificationModuleService, IOrderModuleService } from '@medusajs/framework/types'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'
import { SENDGRID_API_KEY, SENDGRID_ORDER_PLACED_TEMPLATE_ID } from '../lib/constants'
import { EmailTemplates } from '../modules/email-notifications/templates'

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  const notificationModuleService: INotificationModuleService = container.resolve(Modules.NOTIFICATION)
  const orderModuleService: IOrderModuleService = container.resolve(Modules.ORDER)
  
  const order = await orderModuleService.retrieveOrder(data.id, { relations: ['items', 'summary', 'shipping_address'] })
  const shippingAddress = await (orderModuleService as any).orderAddressService_.retrieve(order.shipping_address.id)

  // SendGrid resolves `template` as a Dynamic Template ID from its own dashboard,
  // while Resend resolves it against the React templates in ../modules/email-notifications.
  if (SENDGRID_API_KEY && !SENDGRID_ORDER_PLACED_TEMPLATE_ID) {
    console.error('SENDGRID_ORDER_PLACED_TEMPLATE_ID is not set - skipping order confirmation email')
    return
  }
  const template = SENDGRID_API_KEY ? SENDGRID_ORDER_PLACED_TEMPLATE_ID! : EmailTemplates.ORDER_PLACED

  try {
    await notificationModuleService.createNotifications({
      to: order.email,
      channel: 'email',
      template,
      data: {
        emailOptions: {
          replyTo: 'info@example.com',
          subject: 'Your order has been placed'
        },
        order,
        shippingAddress,
        preview: 'Thank you for your order!'
      }
    })
  } catch (error) {
    console.error('Error sending order confirmation notification:', error)
  }
}

export const config: SubscriberConfig = {
  event: 'order.placed'
}
