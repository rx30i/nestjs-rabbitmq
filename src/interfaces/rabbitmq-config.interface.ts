import { ModuleMetadata } from '@nestjs/common/interfaces';
import { LoggerService } from '@nestjs/common';
import { Options } from 'amqplib';

interface IQueue {
  queue: string,
  options: Options.AssertQueue
}

interface IBind {
  queue: string,
  source : string,
  pattern: string,
  args?: any
}

export interface IRabbitMQModuleConfig {
  tratarErro?: LoggerService,
  conexao: {
    dns: string,
  },
  exchange?: {
    name : string,
    type : string,
    options: Options.AssertExchange
  },
  queue?: IQueue[],
  bind? : IBind[],
}

export interface IRabbitMQModuleAsyncConfig extends Pick<ModuleMetadata, 'imports'> {
  useFactory?: (...args: any[]) => Promise<IRabbitMQModuleConfig> | IRabbitMQModuleConfig;
  inject?: any[];
  isGlobal?: boolean;
}
