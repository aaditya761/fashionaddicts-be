import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Option } from './option.entity';
import { Comment } from '../../comments/entities/comment.entity';

export enum PostType {
  CHOOSE = 'choose',
  LOOK = 'look',
}

@Entity('posts')
export class Post extends BaseEntity {
  @Column()
  title: string;

  @Column({
    name: 'postType',
    type: 'enum',
    enum: PostType,
    default: 'choose',
  })
  type: PostType;

  @Column()
  description: string;

  @ManyToOne(() => User, (user) => user.posts, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => Option, (option) => option.post, {
    cascade: true,
    eager: true,
  })
  options: Option[];

  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];
}
