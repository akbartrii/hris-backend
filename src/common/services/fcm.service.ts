import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);

  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    // TODO: Integrate firebase-admin here when credentials are available
    // Example:
    // await admin.messaging().send({
    //   token: fcmToken,
    //   notification: { title, body },
    //   data,
    // });
    this.logger.log(`[FCM Stub] To user ${userId}: ${title} — ${body}`);
  }
}
