import { IRabbitMQModuleConfig } from '../interfaces';
import { Injectable, Inject } from '@nestjs/common';
import { RABBITMQ_CONFIG } from '../constants';
import * as amqplib from 'amqplib';

@Injectable()
export class RabbitMqService {
  private conexao: amqplib.Connection;
  private channel: amqplib.Channel;

  constructor (
    @Inject(RABBITMQ_CONFIG)
    private readonly config: IRabbitMQModuleConfig
  ) {}

  public async obterCanal (): Promise<amqplib.Channel> | null {
    try {
      if (this.conexao && this.channel) {
        return this.channel;
      }

      this.conexao = await amqplib.connect(this.config.conexao.dns);
      this.channel = await this.conexao.createChannel();

      this.erros();
      return this.channel;
    } catch(erro) {
      this.config.tratarErro.error(
        'RabbitMqService',
        erro.stack || erro.message
      );

      return null;
    }
  }

  private async erros () {
    if (this.config.tratarErro !== undefined) {
      this.conexao.on('error', (erro: any) => {
        this.config.tratarErro.error(
          'RabbitMqService',
          erro.stack || erro.message
        );
      });
    }
  }
}
