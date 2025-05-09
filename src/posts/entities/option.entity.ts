import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Post } from './post.entity';
import { Vote } from '../../votes/entities/vote.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('options')
export class Option extends BaseEntity {
  @ApiProperty({ description: 'Product URL', nullable: true })
  @Column({ nullable: true })
  url?: string;

  @ManyToOne(() => Post, (post) => post.options, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @OneToMany(() => Vote, (vote) => vote.option)
  votes: Vote[];

  @ApiProperty({ description: 'Number of votes' })
  votesCount?: number;

  @ApiProperty({
    description: 'Whether the current user voted for this option',
  })
  hasUserVoted?: boolean;
}
