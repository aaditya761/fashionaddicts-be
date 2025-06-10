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
  @Column({ nullable: true })
  votesCount?: number;

  @Column({ nullable: true })
  image?: string;

  @Column({ nullable: true })
  productName?: string;

  @Column({ nullable: true })
  siteName?: string;
}
