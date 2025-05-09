import { Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Option } from '../../posts/entities/option.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('votes')
export class Vote extends BaseEntity {
  @ApiProperty({ description: 'Voter' })
  @ManyToOne(() => User, (user) => user.votes)
  @JoinColumn({ name: 'user' })
  user: User;

  @ApiProperty({ description: 'Option being voted for' })
  @ManyToOne(() => Option, (option) => option.votes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'optionId' })
  option: Option;
}
