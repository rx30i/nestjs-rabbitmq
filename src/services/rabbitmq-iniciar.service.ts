import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { IRabbitMQModuleConfig } from '../interfaces';
import { RABBITMQ_CONFIG } from '../constants';
import * as amqplib from 'amqplib';

@Injectable()
export class RabbitMqIniciarService implements OnModuleInit {
  private conexao: amqplib.Connection;
  private channel: amqplib.Channel;

  constructor (
    @Inject(RABBITMQ_CONFIG)
    private readonly config: IRabbitMQModuleConfig
  ) {}

  public async onModuleInit (): Promise<void> {
    try {
      this.conexao = await amqplib.connect(this.config.conexao.dns);
      this.channel = await this.conexao.createChannel();

      this.erros();
      await this.declararExchange();
      await this.declararQueue();
      await this.bind();

      await this.channel.close();
      await this.conexao.close();
    } catch(erro) {
      this.config.tratarErro.error(
        'RabbitMqIniciarService',
        erro.stack || erro.message
      );
    }
  }

  private async declararExchange (): Promise<void> {
    if (this.config.exchange !== undefined) {
      const conf = this.config.exchange.options;
      const nome = this.config.exchange.name;
      const tipo = this.config.exchange.type;

      await this.channel.assertExchange(nome, tipo, conf);
    }
  }

  private async declararQueue (): Promise<void> {
    if (this.config.queue !== undefined) {
      for await (const config of this.config.queue) {
        await this.channel.assertQueue(config.queue, config.options);
      }
    }
  }

  private async bind (): Promise<void> {
    if (this.config.bind !== undefined) {
      for await (const config of this.config.bind) {
        await this.channel.bindQueue(config.queue, config.source, config.pattern);
      }
    }
  }

  private async erros () {
    if (this.config.tratarErro !== undefined) {
      this.conexao.on('error', (erro: any) => {
        this.config.tratarErro.error(
          'RabbitMqIniciarService',
          erro.stack || erro.message
        );
      });
    }
  }
}
