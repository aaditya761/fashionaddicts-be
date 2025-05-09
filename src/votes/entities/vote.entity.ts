import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Option } from '../../posts/entities/option.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('votes')
@Unique(['userId', 'optionId'])
export class Vote extends BaseEntity {
  @ApiProperty({ description: 'Voter' })
  @ManyToOne(() => User, (user) => user.votes)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @ApiProperty({ description: 'Option being voted for' })
  @ManyToOne(() => Option, (option) => option.votes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'optionId' })
  option: Option;

  @Column()
  optionId: number;
}
