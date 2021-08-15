import { RabbitMqIniciarService, RabbitMqService} from './services';
import { Module, DynamicModule, Provider } from '@nestjs/common';
import { IRabbitMQModuleAsyncConfig } from './interfaces';
import { RABBITMQ_CONFIG } from './constants';

@Module({})
export class RabbitMQModule {
  public static forRootAsync (config: IRabbitMQModuleAsyncConfig): DynamicModule {
    return {
      module   : RabbitMQModule,
      global   : config.isGlobal || false,
      imports  : config.imports,
      providers: [
        RabbitMQModule.configProvider(config),
        RabbitMqIniciarService,
        RabbitMqService,
      ],
      exports: [RabbitMqService],
    };
  }

  private static configProvider (config: IRabbitMQModuleAsyncConfig): Provider {
    return {
      provide   : RABBITMQ_CONFIG,
      inject    : config.inject || [],
      useFactory: config.useFactory,
    };
  }
}
