import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class KeepAliveService {
  private readonly logger = new Logger(KeepAliveService.name);

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleCron() {
    this.logger.log('Keep-alive cron job executed');
    // This cron runs while the app is awake.
    // For Render Free Tier, also use an external ping service
    // (e.g., cron-job.org, UptimeRobot) to hit /api/health every 10 minutes
    // because internal cron stops when the instance spins down.
  }
}
