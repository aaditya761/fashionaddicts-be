import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Option } from './option.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('posts')
export class Post extends BaseEntity {
  @ApiProperty({ description: 'Post title' })
  @Column()
  title: string;

  @ApiProperty({ description: 'Post description' })
  @Column()
  description: string;

  @ApiProperty({ description: 'Post creator' })
  @ManyToOne(() => User, (user) => user.posts, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({ description: 'Options to vote on', type: [Option] })
  @OneToMany(() => Option, (option) => option.post, {
    cascade: true,
    eager: true,
  })
  options: Option[];

  @ApiProperty({ description: 'Comments on the post', type: [Comment] })
  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];
}
