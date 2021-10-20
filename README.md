# @rx30i/nestjs-rabbitmq

Este módulo é responsável por se conectar ao rabbitMq através da biblioteca amqplib e retornar essa conexão. Permite também a declaração das filas necessarias. 

## instalação das dependências

`npm i @rx30i/nestjs-rabbitmq amqplib` 

`npm i --save-dev @types/amqplib`

## Configuração do modulo

```typescript
import { RabbitMQModule, IRabbitMQModuleAsyncConfig } from '@rx30i/nestjs-rabbitmq';
import { IRabbitMQModuleConfig } from '@rx30i/nestjs-rabbitmq';
import { ConfigService } from '@nestjs/config';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    RabbitMQModule.forRootAsync({
      isGlobal: true,
      inject  : [
        ConfigService,
      ],
      useFactory: async (configService: ConfigService): Promise<IRabbitMQModuleConfig> => ({
        conexao: {
          dns: configService.get<string>('RABBITMQ_DNS'),
        },
        exchange: {
          name   : 'amq.direct',
          type   : 'direct',
          options: {durable: true},
        },
        queue: [],
        bind : [],
      }),
    }),
  ],
})
export class AppModule {}
```

## Exemplo uso

```typescript
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { RabbitMqService } from '@rx30i/nestjs-rabbitmq';
import { Channel, ConsumeMessage } from 'amqplib';

@Injectable()
export class ExemploService implements OnApplicationBootstrap {
  private channel: Channel;

  constructor (
    private readonly rabbitMq: RabbitMqService,
  ) {}

  public onApplicationBootstrap () {
    this.receberMsgRabbitMq();
  }

  private async receberMsgRabbitMq (): Promise<void> {
    const filaMq = 'nome.fila';
    this.channel = await this.rabbitMq.obterCanal();
    this.channel.on('close', () => {
      this.receberMsgRabbitMq();
    });

    this.channel.prefetch(1);
    this.channel.consume(filaMq, async (mensagem: any) => {
     console.log(mensagem);
    });
  }
}
```
