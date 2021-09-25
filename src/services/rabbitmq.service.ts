import { Injectable, Inject, Logger, LoggerService } from '@nestjs/common';
import { IRabbitMQModuleConfig } from '../interfaces';
import { RABBITMQ_CONFIG } from '../constants';
import * as amqplib from 'amqplib';

@Injectable()
export class RabbitMqService {
  private conexao: amqplib.Connection;
  private channel: amqplib.Channel;
  private logger: LoggerService;

  constructor (
    @Inject(RABBITMQ_CONFIG)
    private readonly config: IRabbitMQModuleConfig
  ) {
    this.logger = Logger;
    if (this.config?.loggerService) {
      this.logger = this.config?.loggerService;
    }
  }

  /**
   * Se não for possível estabelecer uma conexão com o rabbitMq é retornado "undefined".
   * Caso você receba um "undefined", aguarde alguns segundos e chame este método novamente
   * para que uma nova tentatica de conexão seja realizada.
   *
   * @returns {Promise<amqplib.Channel> | undefined}
   */
  public async obterCanal (): Promise<amqplib.Channel> | undefined {
    if (this.channel === undefined) {
      await this.iniciar();
    }

    return this.channel;
  }

  private async iniciar (): Promise<void> {
    try {
      this.conexao = await amqplib.connect(this.config.conexao.dns);
      this.channel = await this.conexao.createChannel();
      this.channel.on('blocked', (reason) => {
        this.logger.error('O servidor bloqueou a conexão', reason);
      });

      this.erros();
      await this.declararExchange();
      await this.declararQueue();
      await this.bind();

      this.conexaoRabbitMqEncerrada();
      this.desconectadoDoCanal();
    } catch (erro) {
      this.conexao = undefined;
      this.channel = undefined;

      this.logger.error(
        'Erro ao iniciar o modulo RabbitMQModule',
        erro.message
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

  private conexaoRabbitMqEncerrada () {
    this.conexao.on('close', (erro) => {
      this.logger.error('A conexão com o RabbitMQ foi fechada.', erro?.message);

      this.conexao = undefined;
      this.channel = undefined;
    });
  }

  private desconectadoDoCanal () {
    this.channel.on('close', (erro) =>
      this.logger.error('Canal RabbitMQ fechado com sucesso', erro?.message)
    );
  }

  private erros () {
    this.conexao.on('error', (erro: any) => {
      this.logger.error(
        'Falha na conexão com o RabbitMQ',
        erro.message
      );
    });

    this.channel.on('error', (erro: any) => {
      this.logger.error(
        'Falha ao configurar o canal RabbitMQ',
        erro.message
      );
    });
  }
}
